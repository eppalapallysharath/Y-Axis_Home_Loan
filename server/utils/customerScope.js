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
  const userId = user.sub || user.id;

  if (user.role === 'ADMIN') {
    return {};
  }

  if (user.role === 'MANAGER') {
    return {
      applications: {
        some: {
          assignedTo: {
            teamId: user.teamId,
          },
        },
      },
    };
  }

  if (user.role === 'EXECUTIVE') {
    return {
      OR: [
        { createdById: userId },
        {
          applications: {
            some: {
              assignedToId: userId,
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
  const userId = user.sub || user.id;

  if (user.role === 'ADMIN') {
    return {};
  }

  if (user.role === 'MANAGER') {
    return {
      assignedTo: {
        teamId: user.teamId,
      },
    };
  }

  if (user.role === 'EXECUTIVE') {
    return {
      assignedToId: userId,
    };
  }

  return { id: -1 };
};

module.exports = {
  buildCustomerScope,
  buildApplicationScopeForCustomer,
};
