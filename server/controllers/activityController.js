const { prisma } = require('../config/db');
const { verifyApplicationAccess } = require('../utils/accessControl');
const activityService = require('../services/activityService');

/**
 * GET /api/v1/applications/:appId/activity
 * List paginated activity logs for a loan application with optional action filtering
 */
const list = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { page = 1, limit = 50, actions } = req.query;

    const applicationId = parseInt(appId, 10);
    if (isNaN(applicationId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid application ID' });
    }

    // Verify user has access to the application
    await verifyApplicationAccess(applicationId, req.user);

    // Filter by action types if provided
    const actionFilter = actions
      ? { action: { in: actions.split(',').map((a) => a.trim()).filter(Boolean) } }
      : {};

    const take = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * take;

    const where = { applicationId, ...actionFilter };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: { id: true, name: true, role: true, email: true },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/applications/:appId/notes
 * Add a manual note entry to the activity log
 */
const addNote = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { noteText } = req.body;

    const applicationId = parseInt(appId, 10);
    if (isNaN(applicationId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid application ID' });
    }

    if (!noteText || typeof noteText !== 'string' || noteText.trim().length === 0) {
      return res.status(422).json({
        status: 'error',
        errorType: 'ValidationError',
        message: 'Note text is required and cannot be empty.',
      });
    }

    if (noteText.trim().length > 1000) {
      return res.status(422).json({
        status: 'error',
        errorType: 'ValidationError',
        message: 'Note text must be 1000 characters or fewer.',
      });
    }

    // Verify application access
    await verifyApplicationAccess(applicationId, req.user);

    const userId = req.user.sub || req.user.id;

    // Log the note action
    const logEntry = await activityService.log({
      applicationId,
      userId,
      action: 'NOTE_ADDED',
      metadata: { noteText: noteText.trim() },
    });

    res.status(201).json({
      status: 'success',
      message: 'Note added successfully',
      data: logEntry,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  addNote,
};
