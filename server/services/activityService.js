const { prisma } = require('../config/db');

/**
 * Log an activity event for a loan application.
 *
 * Design: This function is intentionally non-throwing.
 * If logging fails, it logs a warning but does NOT propagate the error —
 * the primary business operation (stage change, assignment, etc.) must not fail due to a logging error.
 *
 * @param {object} params
 * @param {number}  params.applicationId - ID of the loan application
 * @param {number}  params.userId        - ID of the acting user
 * @param {string}  params.action        - ActivityAction enum value
 * @param {object}  [params.metadata]    - Optional context payload
 * @param {object}  [params.tx]          - Optional Prisma transaction client
 */
const log = async ({ applicationId, userId, action, metadata = null, tx = null }) => {
  const client = tx || prisma;

  try {
    return await client.activityLog.create({
      data: {
        applicationId: parseInt(applicationId, 10),
        userId: parseInt(userId, 10),
        action,
        metadata: metadata ? metadata : undefined,
      },
    });
  } catch (err) {
    // Non-blocking: log warning but do not throw
    console.warn(
      `[ActivityService] Failed to log event "${action}" for application ${applicationId}:`,
      err.message
    );
    return null;
  }
};

/**
 * Log multiple events atomically within an existing Prisma transaction.
 * All events are committed together or not at all.
 *
 * @param {object} params
 * @param {Array<object>} params.events - Array of event objects ({ applicationId, userId, action, metadata })
 * @param {object}        params.tx     - Required Prisma transaction client
 */
const logMany = async ({ events, tx }) => {
  if (!tx) throw new Error('logMany requires a Prisma transaction client (tx)');

  return await Promise.all(
    events.map((event) =>
      tx.activityLog.create({
        data: {
          applicationId: parseInt(event.applicationId, 10),
          userId: parseInt(event.userId, 10),
          action: event.action,
          metadata: event.metadata ? event.metadata : undefined,
        },
      })
    )
  );
};

module.exports = {
  log,
  logMany,
  logActivity: log, // Backwards compatibility alias
};
