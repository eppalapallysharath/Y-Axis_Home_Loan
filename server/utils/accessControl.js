const { prisma } = require('../config/db');

/**
 * Validates whether the given user has permission to access or mutate a specific LoanApplication.
 *  - ADMIN: Full global access
 *  - MANAGER: Access allowed if application's assigned user belongs to the manager's team
 *  - EXECUTIVE: Access allowed only if application.assignedToId === user.sub
 * 
 * @param {number|string} applicationId 
 * @param {object} user - Decoded JWT user (req.user)
 * @returns {Promise<object>} The application record if access is authorized
 * @throws {Error} 404 if not found, 403 if forbidden
 */
const verifyApplicationAccess = async (applicationId, user) => {
  const appId = parseInt(applicationId, 10);
  const userId = user.sub || user.id;

  const application = await prisma.loanApplication.findUnique({
    where: { id: appId },
    include: {
      assignedTo: true,
      createdBy: true,
      customer: true,
    },
  });

  if (!application) {
    const error = new Error(`Loan Application #${appId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'ADMIN') {
    return application;
  }

  if (user.role === 'MANAGER') {
    const isTeamAssigned = application.assignedTo && application.assignedTo.teamId === user.teamId;
    const isUnassigned = !application.assignedToId;
    const isCreator = application.createdById === userId;
    const isCreatorInTeam = application.createdBy && application.createdBy.teamId === user.teamId;

    if (!isTeamAssigned && !isUnassigned && !isCreator && !isCreatorInTeam) {
      const error = new Error(`Forbidden. Application #${appId} does not belong to your team.`);
      error.statusCode = 403;
      throw error;
    }
    return application;
  }

  if (user.role === 'EXECUTIVE') {
    const isAssigned = application.assignedToId === userId;
    const isCreator = application.createdById === userId;

    if (!isAssigned && !isCreator) {
      const error = new Error(`Forbidden. Application #${appId} is not assigned to you.`);
      error.statusCode = 403;
      throw error;
    }
    return application;
  }

  const error = new Error('Forbidden access.');
  error.statusCode = 403;
  throw error;
};

module.exports = {
  verifyApplicationAccess,
};
