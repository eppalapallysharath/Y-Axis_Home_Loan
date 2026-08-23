const { buildCustomerScope } = require('./customerScope');

/**
 * Builds Prisma `where` clause for Customer search and filtering
 * @param {Object} params
 * @param {string} [params.search] - Search keyword for name, email, phone, or PAN
 * @param {string} [params.employmentType] - Customer employment type
 * @param {string} [params.fromDate] - Created date from (ISO date string)
 * @param {string} [params.toDate] - Created date to (ISO date string)
 * @param {Object} params.user - Decoded JWT user object
 * @returns {Object} { where, error }
 */
const buildCustomerQuery = ({ search, employmentType, fromDate, toDate, user }) => {
  // Validate search length
  if (search && search.trim().length > 200) {
    const err = new Error('Search query cannot exceed 200 characters');
    err.statusCode = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Validate date range
  if (fromDate && toDate) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const err = new Error('Invalid date format provided for fromDate or toDate');
      err.statusCode = 422;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (start > end) {
      const err = new Error('fromDate cannot be after toDate');
      err.statusCode = 422;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }

  // Step 1: Role scope
  const scopeFilter = buildCustomerScope(user);

  // Step 2: Free-text search
  const cleanSearch = search ? search.trim() : '';
  const searchFilter = cleanSearch
    ? {
        OR: [
          { fullName: { contains: cleanSearch, mode: 'insensitive' } },
          { email: { contains: cleanSearch, mode: 'insensitive' } },
          { phone: { contains: cleanSearch, mode: 'insensitive' } },
          { panNumber: { contains: cleanSearch, mode: 'insensitive' } },
        ],
      }
    : {};

  // Step 3: Structured field filters
  const dateRangeFilter = {};
  if (fromDate || toDate) {
    dateRangeFilter.createdAt = {};
    if (fromDate) {
      dateRangeFilter.createdAt.gte = new Date(fromDate);
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateRangeFilter.createdAt.lte = endOfDay;
    }
  }

  const fieldFilters = {
    ...(employmentType && { employmentType }),
    ...dateRangeFilter,
  };

  return {
    AND: [scopeFilter, searchFilter, fieldFilters],
  };
};

module.exports = {
  buildCustomerQuery,
};
