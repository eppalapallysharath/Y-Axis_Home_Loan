const { prisma } = require('../config/db');
const { verifyApplicationAccess } = require('../utils/accessControl');
const { logActivity } = require('../services/activityService');
const { STANDARD_WORK_ITEMS } = require('../utils/workItemTemplates');

/**
 * List all work items for a specific loan application
 */
const list = async (req, res, next) => {
  try {
    const { appId } = req.params;

    // Verify user has access to parent application
    await verifyApplicationAccess(appId, req.user);

    const workItems = await prisma.workItem.findMany({
      where: { applicationId: parseInt(appId, 10) },
      orderBy: { createdAt: 'asc' },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      status: 'success',
      data: workItems,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a single work item for a loan application
 */
const create = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { title, description, type, assignedToId } = req.body;

    const application = await verifyApplicationAccess(appId, req.user);

    // Guard: Cannot add work items to closed/completed/rejected applications
    if (['COMPLETED', 'REJECTED'].includes(application.stage)) {
      return res.status(422).json({
        status: 'error',
        statusCode: 422,
        errorType: 'InvalidStateError',
        message: 'Cannot add work items to a completed or rejected application.',
      });
    }

    // Validate assignedTo user if provided
    if (assignedToId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(assignedToId, 10) },
      });
      if (!targetUser) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: 'Assignee user not found.',
        });
      }

      if (req.user.role === 'MANAGER' && targetUser.teamId !== req.user.teamId) {
        return res.status(403).json({
          status: 'error',
          statusCode: 403,
          errorType: 'Forbidden',
          message: 'Cannot assign work item to a user outside your team.',
        });
      }
    }

    const workItem = await prisma.workItem.create({
      data: {
        applicationId: parseInt(appId, 10),
        title,
        description: description || null,
        type,
        status: 'OPEN',
        assignedToId: assignedToId ? parseInt(assignedToId, 10) : null,
        createdById: req.user.sub,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await logActivity({
      applicationId: parseInt(appId, 10),
      userId: req.user.sub,
      action: 'WORK_ITEM_CREATED',
      metadata: {
        workItemId: workItem.id,
        workItemTitle: workItem.title,
        type: workItem.type,
      },
    });

    res.status(201).json({
      status: 'success',
      data: workItem,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Apply standard verification checklist (bulk create missing standard items)
 */
const bulkCreate = async (req, res, next) => {
  try {
    const { appId } = req.params;

    const application = await verifyApplicationAccess(appId, req.user);

    if (['COMPLETED', 'REJECTED'].includes(application.stage)) {
      return res.status(422).json({
        status: 'error',
        statusCode: 422,
        errorType: 'InvalidStateError',
        message: 'Cannot add work items to a closed application.',
      });
    }

    // Check which standard work item types already exist
    const existing = await prisma.workItem.findMany({
      where: { applicationId: parseInt(appId, 10) },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((w) => w.type));

    const toCreate = STANDARD_WORK_ITEMS.filter((t) => !existingTypes.has(t.type));

    if (toCreate.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Standard checklist already applied — all work item types already exist.',
      });
    }

    // Bulk create in a transaction
    const created = await prisma.$transaction(
      toCreate.map((template) =>
        prisma.workItem.create({
          data: {
            applicationId: parseInt(appId, 10),
            title: template.title,
            description: template.description,
            type: template.type,
            status: 'OPEN',
            createdById: req.user.sub,
          },
          include: {
            assignedTo: { select: { id: true, name: true, role: true } },
            createdBy: { select: { id: true, name: true } },
          },
        })
      )
    );

    // Log one activity entry for bulk creation
    await logActivity({
      applicationId: parseInt(appId, 10),
      userId: req.user.sub,
      action: 'WORK_ITEM_CREATED',
      metadata: {
        bulk: true,
        count: created.length,
        types: created.map((w) => w.type),
      },
    });

    res.status(201).json({
      status: 'success',
      data: created,
      message: `${created.length} standard work items created.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update work item status, title, description, or assignment
 */
const update = async (req, res, next) => {
  try {
    const { appId, itemId } = req.params;
    const { status, title, description, assignedToId } = req.body;

    const application = await verifyApplicationAccess(appId, req.user);

    const workItem = await prisma.workItem.findUnique({
      where: { id: parseInt(itemId, 10) },
    });

    if (!workItem || workItem.applicationId !== parseInt(appId, 10)) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Work item not found.',
      });
    }

    // Guard: COMPLETED work items cannot be modified
    if (workItem.status === 'COMPLETED') {
      return res.status(422).json({
        status: 'error',
        statusCode: 422,
        errorType: 'InvalidStateError',
        message: 'Cannot modify a completed work item.',
      });
    }

    // Executive fine-grained access check
    if (req.user.role === 'EXECUTIVE') {
      const isWorkItemAssignee = workItem.assignedToId === req.user.sub;
      const isApplicationAssignee = application.assignedToId === req.user.sub;
      if (!isWorkItemAssignee && !isApplicationAssignee) {
        return res.status(403).json({
          status: 'error',
          statusCode: 403,
          errorType: 'Forbidden',
          message: 'You can only update work items on applications assigned to you.',
        });
      }

      if (assignedToId !== undefined) {
        return res.status(403).json({
          status: 'error',
          statusCode: 403,
          errorType: 'Forbidden',
          message: 'Executives cannot reassign work items.',
        });
      }
    }

    // Manager scope check for reassignment
    if (req.user.role === 'MANAGER' && assignedToId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(assignedToId, 10) },
      });
      if (!targetUser) {
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: 'Assignee user not found.',
        });
      }
      if (targetUser.teamId !== req.user.teamId) {
        return res.status(403).json({
          status: 'error',
          statusCode: 403,
          errorType: 'Forbidden',
          message: 'Cannot assign work item to a user outside your team.',
        });
      }
    }

    // Validate status transition
    if (status) {
      const validStatusTransitions = {
        OPEN: ['IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
        IN_PROGRESS: ['COMPLETED', 'BLOCKED'],
        BLOCKED: ['IN_PROGRESS'],
        COMPLETED: [],
      };

      if (!validStatusTransitions[workItem.status]?.includes(status)) {
        return res.status(422).json({
          status: 'error',
          statusCode: 422,
          errorType: 'InvalidStatusTransition',
          message: `Cannot transition work item from ${workItem.status} to ${status}.`,
        });
      }
    }

    const isBeingCompleted = status === 'COMPLETED' && workItem.status !== 'COMPLETED';

    const updated = await prisma.workItem.update({
      where: { id: parseInt(itemId, 10) },
      data: {
        ...(status !== undefined && { status }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId ? parseInt(assignedToId, 10) : null }),
        ...(isBeingCompleted && { completedAt: new Date() }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Log activity
    const activityAction = isBeingCompleted ? 'WORK_ITEM_COMPLETED' : 'WORK_ITEM_STATUS_UPDATED';
    await logActivity({
      applicationId: parseInt(appId, 10),
      userId: req.user.sub,
      action: activityAction,
      metadata: {
        workItemId: updated.id,
        workItemTitle: updated.title,
        type: updated.type,
        fromStatus: workItem.status,
        toStatus: updated.status,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an OPEN work item (ADMIN and MANAGER only)
 */
const remove = async (req, res, next) => {
  try {
    const { appId, itemId } = req.params;

    const application = await verifyApplicationAccess(appId, req.user);

    // Only ADMIN or MANAGER can delete work items
    if (req.user.role === 'EXECUTIVE') {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        errorType: 'Forbidden',
        message: 'Executives cannot delete work items.',
      });
    }

    const workItem = await prisma.workItem.findUnique({
      where: { id: parseInt(itemId, 10) },
    });

    if (!workItem || workItem.applicationId !== parseInt(appId, 10)) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Work item not found.',
      });
    }

    // Only OPEN work items can be deleted
    if (workItem.status !== 'OPEN') {
      return res.status(422).json({
        status: 'error',
        statusCode: 422,
        errorType: 'CannotDeleteNonOpenItem',
        message: `Only OPEN work items can be deleted. This item is ${workItem.status}.`,
      });
    }

    await prisma.workItem.delete({
      where: { id: parseInt(itemId, 10) },
    });

    res.status(200).json({
      status: 'success',
      message: 'Work item deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  bulkCreate,
  update,
  remove,
};
