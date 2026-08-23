/**
 * Utility to build role-based Prisma where clause filter for LoanApplication queries
 * @param {object} user - Decoded JWT user object from req.user
 * @returns {object} Prisma where clause filter
 */
const buildApplicationScope = (user) => {
  if (!user) return { id: -1 };
  const userId = parseInt(user.sub || user.id, 10);

  if (user.role === 'ADMIN') {
    return {};
  }

  if (user.role === 'MANAGER') {
    return {
      OR: [
        ...(user.teamId
          ? [
              { assignedTo: { teamId: user.teamId } },
              { createdBy: { teamId: user.teamId } },
            ]
          : []),
        { assignedToId: null },
        { createdById: userId },
      ],
    };
  }

  if (user.role === 'EXECUTIVE') {
    return {
      OR: [
        { assignedToId: userId },
        { createdById: userId },
      ],
    };
  }

  return { id: -1 };
};

module.exports = {
  buildApplicationScope,
};
