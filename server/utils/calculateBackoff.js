/**
 * Calculate the delay in milliseconds before the next retry attempt.
 * Uses exponential backoff with a fixed cap.
 *
 * Attempt 1 failed → wait 1 minute  before attempt 2
 * Attempt 2 failed → wait 5 minutes before attempt 3
 * Attempt 3 failed → wait 30 minutes before attempt 4
 * Attempt 4 failed → EXHAUSTED (no more retries)
 *
 * @param {number} attemptNumber - The number of attempts that have ALREADY been made
 */
const BACKOFF_DELAYS_MS = [
  1 * 60 * 1000, // 1 minute (after attempt 1)
  5 * 60 * 1000, // 5 minutes (after attempt 2)
  30 * 60 * 1000, // 30 minutes (after attempt 3)
];

const calculateBackoffMs = (attemptNumber) => {
  const index = Math.min(Math.max(0, attemptNumber - 1), BACKOFF_DELAYS_MS.length - 1);
  return BACKOFF_DELAYS_MS[index];
};

module.exports = { calculateBackoffMs };
