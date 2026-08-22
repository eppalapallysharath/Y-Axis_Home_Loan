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
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: (process.env.NODE_ENV || "development") === "development",
};

module.exports = envConfig;
