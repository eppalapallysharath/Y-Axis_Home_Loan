/**
 * Pagination helper utilities for offset-based pagination
 */

/**
 * Parses and sanitizes page, limit, and skip parameters from query object
 * @param {Object} query - Express request query object
 * @param {Object} options - Configuration options (defaultLimit: 20, maxLimit: 100)
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query = {}, options = {}) => {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds standard pagination response metadata
 * @param {number} total - Total count of records
 * @param {number} page - Current page number
 * @param {number} limit - Current page limit
 * @returns {{ total: number, page: number, limit: number, totalPages: number }}
 */
const buildPaginationMeta = (total, page, limit) => {
  const safeTotal = Math.max(0, parseInt(total, 10) || 0);
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, parseInt(limit, 10) || 20);

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(safeTotal / safeLimit) || 1,
  };
};

module.exports = {
  parsePagination,
  buildPaginationMeta,
};
