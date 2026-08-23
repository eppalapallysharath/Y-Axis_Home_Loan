const dotenv = require("dotenv");
const path = require("path");

// Load .env file from server root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const envConfig = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "yaxis_home_loan_access_secret_key_32bytes_min!",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "yaxis_home_loan_refresh_secret_key_32bytes_min!",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  cbsBaseUrl: process.env.CBS_BASE_URL || `http://localhost:${parseInt(process.env.PORT, 10) || 5000}/mock-cbs`,
  cbsTimeoutMs: parseInt(process.env.CBS_TIMEOUT_MS, 10) || 10000,
  cbsMaxAttempts: parseInt(process.env.CBS_MAX_ATTEMPTS, 10) || 4,
  cbsRetryWorkerInterval: parseInt(process.env.CBS_RETRY_WORKER_INTERVAL, 10) || 60000,
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: (process.env.NODE_ENV || "development") === "development",
};

module.exports = envConfig;
