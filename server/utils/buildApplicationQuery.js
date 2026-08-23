const { buildApplicationScope } = require('./buildApplicationScope');

/**
 * Parses single or comma-separated enum values for Prisma queries
 * @param {string} param - e.g. "NEW" or "NEW,IN_PROGRESS"
 * @returns {string|Object|undefined}
 */
const parseEnumFilter = (param) => {
  if (!param || typeof param !== 'string') return undefined;
  const values = param
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (values.length === 0) return undefined;
  return values.length === 1 ? values[0] : { in: values };
};

/**
 * Builds scope-aware Prisma `where` clause for Application search & filtering
 * @param {Object} params
 * @returns {Object} Prisma `where` filter object
 */
const buildApplicationQuery = ({
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
}) => {
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
  const scopeFilter = buildApplicationScope(user);

  // Step 2: Free-text search
  const cleanSearch = search ? search.trim() : '';
  const parsedSearchId = parseInt(cleanSearch, 10);
  const isNumericSearch = !isNaN(parsedSearchId) && String(parsedSearchId) === cleanSearch;

  const searchFilter = cleanSearch
    ? {
        OR: [
          { customer: { fullName: { contains: cleanSearch, mode: 'insensitive' } } },
          { customer: { panNumber: { contains: cleanSearch, mode: 'insensitive' } } },
          ...(isNumericSearch ? [{ id: parsedSearchId }] : []),
        ],
      }
    : {};

  // Step 3: Parse structured filters
  const stageFilter = parseEnumFilter(stage);
  const priorityFilter = parseEnumFilter(priority);
  const loanTypeFilter = parseEnumFilter(loanType);

  // EXECUTIVE role cannot filter by cbsSyncStatus
  const effectiveCbsSyncStatus = user && user.role === 'EXECUTIVE' ? undefined : cbsSyncStatus;

  // Date range
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
    ...(stageFilter && { stage: stageFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
    ...(loanTypeFilter && { applicationType: loanTypeFilter }),
    ...(assignedToId && { assignedToId: parseInt(assignedToId, 10) }),
    ...(customerId && { customerId: parseInt(customerId, 10) }),
    ...(effectiveCbsSyncStatus && { cbsSyncStatus: effectiveCbsSyncStatus }),
    ...dateRangeFilter,
  };

  return {
    AND: [scopeFilter, searchFilter, fieldFilters],
  };
};

module.exports = {
  parseEnumFilter,
  buildApplicationQuery,
};
