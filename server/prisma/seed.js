const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.cbsSyncJob.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.loanApplication.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const commonPasswordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Admin User & System User
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@yaxis.com',
      passwordHash: commonPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created Admin user:', admin.email);

  const systemUser = await prisma.user.create({
    data: {
      name: 'System Internal',
      email: 'system@internal',
      passwordHash: commonPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created System user:', systemUser.email);

  // 2. Create Manager Users first (before teams because team requires managerId)
  const managerHyd = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice.hyd@yaxis.com',
      passwordHash: commonPasswordHash,
      role: 'MANAGER',
    },
  });

  const managerMum = await prisma.user.create({
    data: {
      name: 'Eve Smith',
      email: 'eve.mum@yaxis.com',
      passwordHash: commonPasswordHash,
      role: 'MANAGER',
    },
  });

  // 3. Create Teams
  const teamHyd = await prisma.team.create({
    data: {
      name: 'Hyderabad Branch',
      managerId: managerHyd.id,
    },
  });

  const teamMum = await prisma.team.create({
    data: {
      name: 'Mumbai Branch',
      managerId: managerMum.id,
    },
  });

  // Link Managers to their Teams
  await prisma.user.update({
    where: { id: managerHyd.id },
    data: { teamId: teamHyd.id },
  });

  await prisma.user.update({
    where: { id: managerMum.id },
    data: { teamId: teamMum.id },
  });

  console.log('✅ Created Teams and Managers');

  // 4. Create Executives
  const execHyd1 = await prisma.user.create({
    data: {
      name: 'Bob Kumar',
      email: 'bob.hyd1@yaxis.com',
      passwordHash: commonPasswordHash,
      role: 'EXECUTIVE',
      teamId: teamHyd.id,
    },
  });

  const execHyd2 = await prisma.user.create({
    data: {
      name: 'Charlie Rao',
      email: 'charlie.hyd2@yaxis.com',
      passwordHash: commonPasswordHash,
      role: 'EXECUTIVE',
      teamId: teamHyd.id,
    },
  });

  const execMum1 = await prisma.user.create({
    data: {
      name: 'Frank Patel',
      email: 'frank.mum1@yaxis.com',
      passwordHash: commonPasswordHash,
      role: 'EXECUTIVE',
      teamId: teamMum.id,
    },
  });

  console.log('✅ Created Executives');

  // 5. Create Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '9876543210',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '123456789012',
      address: 'Plot 42, Jubilee Hills, Hyderabad',
      employmentType: 'Salaried',
      annualIncome: 1800000,
      creditScore: 780,
      createdById: execHyd1.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      fullName: 'Priya Verma',
      email: 'priya.verma@example.com',
      phone: '9876543211',
      panNumber: 'XYZPS9876K',
      aadhaarNumber: '987654321098',
      address: 'Flat 302, Gachibowli, Hyderabad',
      employmentType: 'Self-Employed',
      annualIncome: 2400000,
      creditScore: 740,
      createdById: execHyd2.id,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      fullName: 'Vikram Mehta',
      email: 'vikram.mehta@example.com',
      phone: '9876543212',
      panNumber: 'MNBVC5678L',
      aadhaarNumber: '567890123456',
      address: 'Tower A, Bandra West, Mumbai',
      employmentType: 'Salaried',
      annualIncome: 3200000,
      creditScore: 810,
      createdById: execMum1.id,
    },
  });

  console.log('✅ Created Sample Customers');

  // 6. Create Sample Applications
  const app1 = await prisma.loanApplication.create({
    data: {
      customerId: customer1.id,
      applicationType: 'HOME_LOAN',
      loanAmount: 7500000,
      propertyAddress: 'Villa 14, Rainbow Vistas, Hyderabad',
      propertyValue: 9500000,
      stage: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedToId: execHyd1.id,
      createdById: execHyd1.id,
    },
  });

  const app2 = await prisma.loanApplication.create({
    data: {
      customerId: customer2.id,
      applicationType: 'TOP_UP',
      loanAmount: 2000000,
      propertyAddress: 'Flat 302, Gachibowli, Hyderabad',
      propertyValue: 8000000,
      stage: 'NEW',
      priority: 'MEDIUM',
      assignedToId: execHyd2.id,
      createdById: execHyd2.id,
    },
  });

  const app3 = await prisma.loanApplication.create({
    data: {
      customerId: customer3.id,
      applicationType: 'LAP',
      loanAmount: 15000000,
      propertyAddress: 'Commercial Shop 4, Andheri East, Mumbai',
      propertyValue: 22000000,
      stage: 'UNDER_REVIEW',
      priority: 'URGENT',
      assignedToId: execMum1.id,
      createdById: execMum1.id,
    },
  });

  console.log('✅ Created Sample Applications');

  // 7. Create Sample Work Items
  await prisma.workItem.create({
    data: {
      applicationId: app1.id,
      title: 'Run CIBIL Score Check',
      description: 'Pull credit report from CIBIL database and verify active loans',
      type: 'CIBIL_CHECK',
      status: 'COMPLETED',
      assignedToId: execHyd1.id,
      createdById: execHyd1.id,
      completedAt: new Date(),
    },
  });

  await prisma.workItem.create({
    data: {
      applicationId: app1.id,
      title: 'Verify Financial Documents',
      description: 'Verify 6-month bank statements, last 3 years ITR, and 3 salary slips.',
      type: 'DOCUMENT_VERIFICATION',
      status: 'COMPLETED',
      assignedToId: execHyd1.id,
      createdById: execHyd1.id,
      completedAt: new Date(),
    },
  });

  await prisma.workItem.create({
    data: {
      applicationId: app1.id,
      title: 'Property Site Valuation',
      description: 'Site visit by empaneled valuer to assess property market value',
      type: 'PROPERTY_VALUATION',
      status: 'IN_PROGRESS',
      assignedToId: execHyd1.id,
      createdById: execHyd1.id,
    },
  });

  // 8. Create Sample Activity Logs
  await prisma.activityLog.create({
    data: {
      applicationId: app1.id,
      userId: execHyd1.id,
      action: 'CREATED',
      metadata: { initialStage: 'NEW', loanAmount: 7500000 },
    },
  });

  await prisma.activityLog.create({
    data: {
      applicationId: app1.id,
      userId: execHyd1.id,
      action: 'STATUS_CHANGED',
      metadata: { fromStage: 'NEW', toStage: 'IN_PROGRESS' },
    },
  });

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n--- Demo Credentials ---');
  console.log('ADMIN:    admin@yaxis.com / Password@123');
  console.log('MANAGER:  alice.hyd@yaxis.com / Password@123 (Hyderabad Branch)');
  console.log('EXEC:     bob.hyd1@yaxis.com / Password@123 (Hyderabad Branch)');
  console.log('EXEC:     frank.mum1@yaxis.com / Password@123 (Mumbai Branch)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
