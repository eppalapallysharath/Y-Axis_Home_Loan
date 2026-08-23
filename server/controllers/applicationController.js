const { prisma } = require('../config/db');
const { buildApplicationScope } = require('../utils/buildApplicationScope');
const { buildApplicationQuery } = require('../utils/buildApplicationQuery');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { verifyApplicationAccess } = require('../utils/accessControl');
const { logActivity } = require('../services/activityService');
const workflowService = require('../services/workflowService');

const PRIORITY_ORDER = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

/**
 * GET /api/v1/applications
 * List & filter loan applications with role scope & pagination
 */
const list = async (req, res, next) => {
  try {
    const {
      search,
      stage,
      priority,
      loanType,
      assignedToId,
      customerId,
      cbsSyncStatus,
      fromDate,
      toDate,
      page,
      limit,
    } = req.query;

    const { user } = req;

    const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

    let where;
    try {
      where = buildApplicationQuery({
        search,
        stage,
        priority,
        loanType,
        assignedToId,
        customerId,
        cbsSyncStatus,
        fromDate,
        toDate,
        user,
      });
    } catch (valErr) {
      if (valErr.statusCode === 422) {
        return res.status(422).json({
          status: 'error',
          error: valErr.code || 'VALIDATION_ERROR',
          message: valErr.message,
        });
      }
      throw valErr;
    }

    const [rawApplications, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: {
            select: { id: true, fullName: true, panNumber: true, phone: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true, team: { select: { id: true, name: true } } },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { workItems: true },
          },
        },
      }),
      prisma.loanApplication.count({ where }),
    ]);

    // Apply secondary priority sorting on retrieved page
    const applications = [...rawApplications].sort((a, b) => {
      const pDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.status(200).json({
      status: 'success',
      data: applications,
      pagination: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/applications
 * Create a new loan application
 */
const create = async (req, res, next) => {
  try {
    const {
      customerId,
      applicationType,
      loanAmount,
      propertyAddress,
      propertyValue,
      remarks,
      priority,
    } = req.body;

    const parsedCustomerId = parseInt(customerId, 10);
    const parsedLoanAmount = parseFloat(loanAmount);
    const parsedPropertyValue = propertyValue ? parseFloat(propertyValue) : null;

    // Verify Customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: parsedCustomerId },
    });

    if (!customer) {
      return res.status(404).json({ status: 'error', message: 'Customer not found.' });
    }

    // EXECUTIVE scope check
    if (req.user.role === 'EXECUTIVE') {
      const userId = req.user.sub || req.user.id;
      const hasAccess =
        customer.createdById === userId ||
        (await prisma.loanApplication.count({
          where: { customerId: customer.id, assignedToId: userId },
        })) > 0;

      if (!hasAccess) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have access to create an application for this customer.',
        });
      }
    }

    // LTV Check (Loan-to-Value <= 80%)
    if (parsedPropertyValue && parsedLoanAmount) {
      const ltv = (parsedLoanAmount / parsedPropertyValue) * 100;
      if (ltv > 80) {
        return res.status(422).json({
          status: 'error',
          error: 'Loan amount exceeds 80% LTV limit',
          message: `Loan ₹${parsedLoanAmount.toLocaleString('en-IN')} is ${ltv.toFixed(1)}% of property value ₹${parsedPropertyValue.toLocaleString('en-IN')}. Maximum allowed is 80%.`,
        });
      }
    }

    const userId = parseInt(req.user.sub || req.user.id, 10);
    const creatorUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!creatorUser) {
      return res.status(401).json({
        status: 'error',
        message: 'Your user session is invalid or stale (User ID not found). Please log out and log in again.',
      });
    }

    const application = await prisma.loanApplication.create({
      data: {
        customerId: parsedCustomerId,
        applicationType: applicationType || 'HOME_LOAN',
        loanAmount: parsedLoanAmount,
        propertyAddress: propertyAddress || null,
        propertyValue: parsedPropertyValue,
        remarks: remarks || null,
        priority: priority || 'MEDIUM',
        stage: 'NEW',
        cbsSyncStatus: 'PENDING',
        createdById: userId,
        assignedToId: req.user.role === 'EXECUTIVE' ? userId : null,
      },
      include: {
        customer: { select: { id: true, fullName: true, panNumber: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Log Activity: CREATED
    await logActivity({
      applicationId: application.id,
      userId,
      action: 'CREATED',
      metadata: { loanType: application.applicationType, loanAmount: application.loanAmount },
    });

    res.status(201).json({
      status: 'success',
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/applications/:id
 * Retrieve application details with relations & scope check
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appId = parseInt(id, 10);

    if (isNaN(appId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Application ID.' });
    }

    const application = await prisma.loanApplication.findUnique({
      where: { id: appId },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true, role: true, teamId: true, team: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
        workItems: {
          include: { assignedTo: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        cbsSyncJob: true,
      },
    });

    if (!application) {
      return res.status(404).json({ status: 'error', message: `Application #${appId} not found.` });
    }

    // Verify access
    await verifyApplicationAccess(appId, req.user);

    res.status(200).json({
      status: 'success',
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/applications/:id
 * Update application fields (amount, property, remarks, priority)
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appId = parseInt(id, 10);
    const { loanAmount, propertyAddress, propertyValue, remarks, priority, updatedAt } = req.body;

    const existingApp = await verifyApplicationAccess(appId, req.user);

    // Terminal state guard
    if (['COMPLETED', 'REJECTED'].includes(existingApp.stage)) {
      return res.status(422).json({
        status: 'error',
        message: 'Cannot edit a completed or rejected application.',
      });
    }

    // Optimistic concurrency check
    if (updatedAt) {
      const clientTime = new Date(updatedAt).getTime();
      const serverTime = new Date(existingApp.updatedAt).getTime();
      if (Math.abs(clientTime - serverTime) > 1000) {
        return res.status(409).json({
          status: 'error',
          error: 'Conflict',
          message: 'This application was updated by someone else. Please refresh and try again.',
        });
      }
    }

    // Calculate effective LTV
    const effectiveAmount = loanAmount !== undefined ? parseFloat(loanAmount) : existingApp.loanAmount;
    const effectiveValue =
      propertyValue !== undefined
        ? (propertyValue ? parseFloat(propertyValue) : null)
        : existingApp.propertyValue;

    if (effectiveValue && effectiveAmount) {
      const ltv = (effectiveAmount / effectiveValue) * 100;
      if (ltv > 80) {
        return res.status(422).json({
          status: 'error',
          error: 'Loan amount exceeds 80% LTV limit',
          message: `Loan ₹${effectiveAmount.toLocaleString('en-IN')} is ${ltv.toFixed(1)}% of property value ₹${effectiveValue.toLocaleString('en-IN')}. Maximum allowed is 80%.`,
        });
      }
    }

    const updatedApp = await prisma.loanApplication.update({
      where: { id: appId },
      data: {
        ...(loanAmount !== undefined && { loanAmount: parseFloat(loanAmount) }),
        ...(propertyAddress !== undefined && { propertyAddress }),
        ...(propertyValue !== undefined && { propertyValue: propertyValue ? parseFloat(propertyValue) : null }),
        ...(remarks !== undefined && { remarks }),
        ...(priority !== undefined && { priority }),
      },
      include: {
        customer: { select: { id: true, fullName: true, panNumber: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      status: 'success',
      data: updatedApp,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/applications/:id/assign
 * Assign or reassign loan application to an Executive
 */
const assign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appId = parseInt(id, 10);
    const { assignedToId } = req.body;

    const application = await verifyApplicationAccess(appId, req.user);

    // Terminal state guard
    if (['COMPLETED', 'REJECTED'].includes(application.stage)) {
      return res.status(422).json({
        status: 'error',
        message: 'Cannot reassign a completed or rejected application.',
      });
    }

    let targetUserId = null;

    if (assignedToId !== null && assignedToId !== undefined) {
      targetUserId = parseInt(assignedToId, 10);
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

      if (!targetUser) {
        return res.status(404).json({ status: 'error', message: 'Target user not found.' });
      }

      if (targetUser.role !== 'EXECUTIVE') {
        return res.status(422).json({ status: 'error', message: 'Applications can only be assigned to Executives.' });
      }

      // MANAGER scope check — executive must be within manager's team
      if (req.user.role === 'MANAGER' && targetUser.teamId !== req.user.teamId) {
        return res.status(403).json({
          status: 'error',
          message: 'Cannot assign to an Executive outside your team.',
        });
      }
    }

    const previousAssigneeId = application.assignedToId;
    const isReassignment = previousAssigneeId !== null && previousAssigneeId !== targetUserId;

    const previousAssignee = previousAssigneeId
      ? await prisma.user.findUnique({ where: { id: previousAssigneeId }, select: { name: true } })
      : null;

    const updatedApp = await prisma.loanApplication.update({
      where: { id: appId },
      data: { assignedToId: targetUserId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true, team: { select: { id: true, name: true } } } },
        customer: { select: { id: true, fullName: true, panNumber: true } },
      },
    });

    const userId = req.user.sub || req.user.id;

    // Log Activity: ASSIGNED or REASSIGNED
    await logActivity({
      applicationId: appId,
      userId,
      action: isReassignment ? 'REASSIGNED' : 'ASSIGNED',
      metadata: {
        previousAssigneeId,
        previousAssigneeName: previousAssignee ? previousAssignee.name : 'Unassigned',
        newAssigneeId: targetUserId,
        newAssigneeName: updatedApp.assignedTo ? updatedApp.assignedTo.name : 'Unassigned',
      },
    });

    res.status(200).json({
      status: 'success',
      data: updatedApp,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/applications/:id/stage
 * Workflow stage transition
 */
const stageTransition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appId = parseInt(id, 10);
    const { toStage, rejectionReason, updatedAt } = req.body;
    const { user } = req;

    if (isNaN(appId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Application ID.' });
    }

    // Step 1: Access control & application verification
    const application = await verifyApplicationAccess(appId, user);

    // Step 2: Optimistic concurrency check
    if (updatedAt) {
      const clientTime = new Date(updatedAt).getTime();
      const serverTime = new Date(application.updatedAt).getTime();
      if (Math.abs(clientTime - serverTime) > 1000) {
        return res.status(409).json({
          status: 'error',
          error: 'Conflict',
          message: 'This application was updated by someone else. Please refresh and try again.',
        });
      }
    }

    // Step 3: Validate transition via workflow service
    const transitionResult = await workflowService.validateTransition({
      application,
      toStage,
      userRole: user.role,
      rejectionReason,
    });

    if (!transitionResult.valid) {
      return res.status(transitionResult.statusCode).json({
        status: 'error',
        error: transitionResult.errorType,
        message: transitionResult.message,
        ...(transitionResult.blockingItems && { blockingItems: transitionResult.blockingItems }),
        ...(transitionResult.allowedStages && { allowedStages: transitionResult.allowedStages }),
      });
    }

    // Step 4: Apply transition (DB transaction + activity log + CBS job)
    const userId = parseInt(user.sub || user.id, 10);
    const updated = await workflowService.applyTransition({
      application,
      toStage,
      userId,
      rejectionReason,
    });

    res.status(200).json({
      status: 'success',
      data: updated,
      message: `Application moved to ${toStage.replace(/_/g, ' ')}`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  assign,
  stageTransition,
};

