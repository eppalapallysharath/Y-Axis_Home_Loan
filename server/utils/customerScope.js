/**
 * Customer & Application Scope Helpers for RBAC
 */

/**
 * Builds scope-aware Prisma `where` clause for querying Customers
 * @param {Object} user - Decoded JWT user object from req.user
 * @returns {Object} Prisma where filter object
 */
const buildCustomerScope = (user) => {
  if (!user) return { id: -1 };
  const userId = parseInt(user.sub || user.id, 10);

  if (user.role === 'ADMIN') {
    return {};
  }

  if (user.role === 'MANAGER') {
    return {
      OR: [
        { createdById: userId },
        ...(user.teamId
          ? [
              { createdBy: { teamId: user.teamId } },
              {
                applications: {
                  some: {
                    OR: [
                      { assignedTo: { teamId: user.teamId } },
                      { createdBy: { teamId: user.teamId } },
                      { assignedToId: null },
                    ],
                  },
                },
              },
            ]
          : [
              {
                applications: {
                  some: {
                    OR: [
                      { createdById: userId },
                      { assignedToId: null },
                    ],
                  },
                },
              },
            ]),
      ],
    };
  }

  if (user.role === 'EXECUTIVE') {
    return {
      OR: [
        { createdById: userId },
        {
          applications: {
            some: {
              OR: [
                { assignedToId: userId },
                { createdById: userId },
              ],
            },
          },
        },
      ],
    };
  }

  return { id: -1 };
};

/**
 * Builds scope-aware Prisma `where` clause for filtering Applications nested in Customer detail
 * @param {Object} user - Decoded JWT user object from req.user
 * @returns {Object} Prisma where filter object
 */
const buildApplicationScopeForCustomer = (user) => {
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
  buildCustomerScope,
  buildApplicationScopeForCustomer,
};
