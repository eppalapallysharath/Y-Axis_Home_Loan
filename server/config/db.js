const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const envConfig = require("./env.config");

const connectionString = envConfig.databaseUrl;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const testDbConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database is connected");
    return true;
  } catch (error) {
    console.error("⚠️ PostgreSQL connection error:", error.message);
    return false;
  }
};

module.exports = {
  prisma,
  testDbConnection,
};
