const app = require("./app");
const envConfig = require("./config/env.config");
const { prisma, testDbConnection } = require("./config/db");
const { startRetryWorker, stopRetryWorker } = require("./workers/cbsRetryWorker");

// ==========================================
// 1. Uncaught Exception Handler
// ==========================================
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// ==========================================
// 2. Start HTTP Server & Test DB Connection
// ==========================================
const server = app.listen(envConfig.port, async () => {
  console.log(`===========================================`);
  console.log(`🚀 Server running in [${envConfig.env.toUpperCase()}] mode`);
  console.log(`📡 Listening on http://localhost:${envConfig.port}`);
  console.log(`🔗 Allowed CORS Origin: ${envConfig.clientOrigin}`);
  console.log(`🌐 Base API URL: http://localhost:${envConfig.port}${envConfig.apiPrefix || ""}`);
  console.log(`===========================================`);

  // Connect and test PostgreSQL connection via Prisma
  await testDbConnection();

  // Start CBS retry worker background task
  startRetryWorker();
});

// ==========================================
// 3. Unhandled Rejection Handler
// ==========================================
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down gracefully...");
  console.error(err);
  server.close(async () => {
    stopRetryWorker();
    await prisma.$disconnect();
    process.exit(1);
  });
});

// ==========================================
// 4. Graceful Shutdown Signals (SIGTERM / SIGINT)
// ==========================================
const gracefulShutdown = (signal) => {
  console.log(`👋 ${signal} RECEIVED. Shutting down gracefully...`);
  server.close(async () => {
    console.log("🔌 Stopping CBS retry worker...");
    stopRetryWorker();
    console.log("🔌 Disconnecting Prisma database client...");
    await prisma.$disconnect();
    console.log("💥 Process terminated cleanly.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
