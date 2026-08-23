const { prisma } = require('../config/db');
const cbsService = require('./cbsIntegrationService');

/**
 * Valid stage transitions and authorized roles
 */
const VALID_TRANSITIONS = {
  NEW: {
    WAITING_FOR_INFO: ['ADMIN', 'MANAGER', 'EXECUTIVE'],
    IN_PROGRESS: ['ADMIN', 'MANAGER', 'EXECUTIVE'],
    REJECTED: ['ADMIN', 'MANAGER'],
  },
  WAITING_FOR_INFO: {
    IN_PROGRESS: ['ADMIN', 'MANAGER', 'EXECUTIVE'],
    REJECTED: ['ADMIN', 'MANAGER'],
  },
  IN_PROGRESS: {
    WAITING_FOR_INFO: ['ADMIN', 'MANAGER', 'EXECUTIVE'],
    UNDER_REVIEW: ['ADMIN', 'MANAGER', 'EXECUTIVE'],
    REJECTED: ['ADMIN', 'MANAGER'],
  },
  UNDER_REVIEW: {
    COMPLETED: ['ADMIN', 'MANAGER'],
    REJECTED: ['ADMIN', 'MANAGER'],
    IN_PROGRESS: ['ADMIN', 'MANAGER'],
  },
  COMPLETED: {
    IN_PROGRESS: ['ADMIN', 'MANAGER'],
  },
  REJECTED: {
    IN_PROGRESS: ['ADMIN', 'MANAGER'],
  },
};

/**
 * Work item blocking rules for transitions
 */
const BLOCKING_WORK_ITEM_RULES = {
  'IN_PROGRESS->UNDER_REVIEW': {
    types: ['CIBIL_CHECK', 'DOCUMENT_VERIFICATION', 'LEGAL_TITLE_SEARCH', 'PROPERTY_VALUATION'],
    statuses: ['OPEN', 'IN_PROGRESS', 'BLOCKED'],
    message: 'All verification work items must be completed before sending to Under Review.',
  },
  'UNDER_REVIEW->COMPLETED': {
    types: ['FINAL_REVIEW'],
    statuses: ['OPEN', 'IN_PROGRESS', 'BLOCKED'],
    message: 'A FINAL_REVIEW work item must be created and completed before approving.',
  },
};

/**
 * Checks whether open/in-progress work items block a transition
 */
const checkWorkItemBlocking = async (applicationId, fromStage, toStage) => {
  const transitionKey = `${fromStage}->${toStage}`;
  const rule = BLOCKING_WORK_ITEM_RULES[transitionKey];

  if (!rule) return null;

  const blockingItems = await prisma.workItem.findMany({
    where: {
      applicationId,
      type: { in: rule.types },
      status: { in: rule.statuses },
    },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
    },
  });

  if (blockingItems.length > 0) {
    return {
      blocked: true,
      message: rule.message,
      blockingItems,
    };
  }

  return null;
};

/**
 * Validates whether a requested transition is valid and allowed for the user
 */
const validateTransition = async ({ application, toStage, userRole, rejectionReason }) => {
  const fromStage = application.stage;

  // Rule 1: Reopening closed application check for EXECUTIVE
  if ((fromStage === 'COMPLETED' || fromStage === 'REJECTED') && userRole === 'EXECUTIVE') {
    return {
      valid: false,
      statusCode: 403,
      errorType: 'Forbidden',
      message: `Only ADMIN or MANAGER can reopen a closed application (${fromStage}).`,
    };
  }

  // Rule 2: Transition validity check
  const allowedRoles = VALID_TRANSITIONS[fromStage]?.[toStage];
  if (!allowedRoles) {
    const allowedNextStages = Object.keys(VALID_TRANSITIONS[fromStage] || {});
    return {
      valid: false,
      statusCode: 422,
      errorType: 'InvalidTransitionError',
      message: `Cannot transition from ${fromStage} to ${toStage}. Allowed next stages: ${
        allowedNextStages.length > 0 ? allowedNextStages.join(', ') : 'None'
      }.`,
      allowedStages: allowedNextStages,
    };
  }

  // Rule 3: Role permission check
  if (!allowedRoles.includes(userRole)) {
    return {
      valid: false,
      statusCode: 403,
      errorType: 'Forbidden',
      message: `Only ${allowedRoles.join(' or ')} can move an application to ${toStage}.`,
    };
  }

  // Rule 4: Rejection reason required when rejecting
  if (toStage === 'REJECTED' && (!rejectionReason || rejectionReason.trim() === '')) {
    return {
      valid: false,
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'A rejection reason is required when rejecting an application.',
    };
  }

  // Rule 5: Work item blocking check
  const blockingResult = await checkWorkItemBlocking(application.id, fromStage, toStage);
  if (blockingResult) {
    return {
      valid: false,
      statusCode: 422,
      errorType: 'WorkItemBlockingError',
      message: blockingResult.message,
      blockingItems: blockingResult.blockingItems,
    };
  }

  return { valid: true };
};

/**
 * Applies stage transition inside a transaction and triggers side effects
 */
const applyTransition = async ({ application, toStage, userId, rejectionReason }) => {
  const fromStage = application.stage;

  const isReopen = fromStage === 'COMPLETED' || fromStage === 'REJECTED';

  const cbsSyncStatus =
    toStage === 'COMPLETED'
      ? 'PENDING'
      : toStage === 'REJECTED'
      ? 'NOT_APPLICABLE'
      : isReopen
      ? 'PENDING'
      : application.cbsSyncStatus;

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update application stage, cbsSyncStatus, and rejectionReason
    const updatedApp = await tx.loanApplication.update({
      where: { id: application.id },
      data: {
        stage: toStage,
        cbsSyncStatus,
        rejectionReason: toStage === 'REJECTED' ? rejectionReason : isReopen ? null : application.rejectionReason,
      },
    });

    // 2. Log activity
    const activityAction = 'STATUS_CHANGED';
    const activityMeta = {
      fromStage,
      toStage,
      ...(isReopen && { reopened: true }),
      ...(rejectionReason && { rejectionReason }),
    };

    await tx.activityLog.create({
      data: {
        applicationId: application.id,
        userId,
        action: activityAction,
        metadata: activityMeta,
      },
    });

    // 3. Upsert CBS Sync Job on COMPLETED
    if (toStage === 'COMPLETED') {
      await tx.cbsSyncJob.upsert({
        where: { applicationId: application.id },
        update: {},
        create: {
          applicationId: application.id,
          status: 'PENDING',
          attempts: 0,
          maxAttempts: 4,
        },
      });
    }

    return updatedApp;
  });

  // 4. Trigger CBS sync asynchronously outside transaction
  if (toStage === 'COMPLETED') {
    cbsService.triggerSync(application.id).catch((err) => {
      console.error(`[CBS] Initial sync trigger failed for app #${application.id}:`, err.message);
    });
  }

  return updated;
};


module.exports = {
  VALID_TRANSITIONS,
  BLOCKING_WORK_ITEM_RULES,
  checkWorkItemBlocking,
  validateTransition,
  applyTransition,
};
