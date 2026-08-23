const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const envConfig = require("./config/env.config");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const customerRoutes = require("./routes/customer.routes");
const applicationRoutes = require("./routes/application.routes");
const cbsSyncRoutes = require("./routes/cbsSync.routes");
const mockCbsRouter = require("./routes/mockCbs");

const app = express();

// ==========================================
// 1. Security & Middleware Setup
// ==========================================

// Helmet HTTP Security Headers
app.use(helmet());

// Cookie Parser Middleware
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = envConfig.clientOrigin
  .split(",")
  .map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*")
      ) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS policy error: Origin ${origin} not allowed.`),
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// HTTP Request Logger
if (envConfig.isDevelopment) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Request Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==========================================
// 2. Routes & Health Checks
// ==========================================

const { prisma } = require("./config/db");

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "success",
      server: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      environment: envConfig.env,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      server: "healthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: envConfig.env,
    });
  }
});

// API V1 Base Endpoint
app.get("/api/v1", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Y-Axis Home Loan Management System API V1",
    timestamp: new Date().toISOString(),
  });
});

// API V1 Routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", userRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/sync-jobs", cbsSyncRoutes);

// Mock Core Banking System Endpoint (simulated external service)
app.use("/mock-cbs", mockCbsRouter);

// ==========================================
// 3. Error Handling Middleware
// ==========================================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    statusCode: 404,
    message: `Cannot find ${req.method} ${req.originalUrl} on this server.`,
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(envConfig.isDevelopment && { stack: err.stack }),
  });
});

// Server configured for Y-Axis Home Loan Processing System - V1
module.exports = app;
