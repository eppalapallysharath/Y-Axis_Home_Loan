const { prisma } = require('../config/db');
const {
  buildCustomerScope,
  buildApplicationScopeForCustomer,
} = require('../utils/customerScope');
const { buildCustomerQuery } = require('../utils/buildCustomerQuery');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * GET /api/v1/customers
 * List & search customers with pagination and role-based scoping
 */
const list = async (req, res, next) => {
  try {
    const { search, employmentType, fromDate, toDate, page, limit } = req.query;
    const user = req.user;

    const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

    let where;
    try {
      where = buildCustomerQuery({ search, employmentType, fromDate, toDate, user });
    } catch (valErr) {
      if (valErr.statusCode === 422) {
        return res.status(422).json({
          status: 'fail',
          error: valErr.code || 'VALIDATION_ERROR',
          message: valErr.message,
        });
      }
      throw valErr;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { applications: true } },
          applications: {
            select: { id: true, stage: true, loanAmount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: customers,
      pagination: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/customers
 * Create new customer record with PAN deduplication
 */
const create = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      panNumber,
      aadhaarNumber,
      dateOfBirth,
      address,
      employmentType = 'SALARIED',
      annualIncome,
      creditScore,
    } = req.body;

    const normalizedPan = panNumber.trim().toUpperCase();
    const userId = parseInt(req.user.sub || req.user.id, 10);

    const creatorUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!creatorUser) {
      return res.status(401).json({
        status: 'error',
        message: 'Your user session is invalid or stale (User ID not found). Please log out and log in again.',
      });
    }

    // Deduplication check based on unique PAN
    const existing = await prisma.customer.findUnique({
      where: { panNumber: normalizedPan },
    });

    if (existing) {
      return res.status(409).json({
        status: 'fail',
        error: 'Duplicate customer',
        message: `A customer with PAN ${normalizedPan} already exists.`,
        existingCustomerId: existing.id,
      });
    }

    const customer = await prisma.customer.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        panNumber: normalizedPan,
        aadhaarNumber: aadhaarNumber ? String(aadhaarNumber).trim() : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address ? address.trim() : null,
        employmentType: employmentType || 'SALARIED',
        annualIncome: annualIncome !== undefined && annualIncome !== null && annualIncome !== '' ? parseFloat(annualIncome) : null,
        creditScore: creditScore !== undefined && creditScore !== null && creditScore !== '' ? parseInt(creditScore, 10) : null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({
      status: 'success',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/customers/:id
 * Get customer detail + summary of their applications
 */
const getById = async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid customer ID' });
    }

    const user = req.user;
    const userId = user.sub || user.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        applications: {
          where: buildApplicationScopeForCustomer(user),
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!customer) {
      return res.status(404).json({ status: 'fail', message: 'Customer not found' });
    }

    // Role-based detail access check for EXECUTIVE
    if (user.role === 'EXECUTIVE') {
      const hasAccess =
        customer.createdById === userId ||
        customer.applications.some((app) => app.assignedToId === userId);
      if (!hasAccess) {
        return res.status(403).json({
          status: 'fail',
          message: 'Access denied: You do not have permission to view this customer',
        });
      }
    }

    res.json({
      status: 'success',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/customers/:id
 * Update customer profile fields
 */
const update = async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid customer ID' });
    }

    const user = req.user;
    const userId = user.sub || user.id;

    // Check customer existence
    const existing = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        applications: {
          select: { assignedToId: true, assignedTo: { select: { teamId: true } } },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ status: 'fail', message: 'Customer not found' });
    }

    // Role scope check
    if (user.role === 'EXECUTIVE') {
      const hasAccess =
        existing.createdById === userId ||
        existing.applications.some((app) => app.assignedToId === userId);
      if (!hasAccess) {
        return res.status(403).json({ status: 'fail', message: 'Access denied to update customer' });
      }
    } else if (user.role === 'MANAGER') {
      const hasAccess =
        existing.createdById === userId ||
        existing.applications.some((app) => app.assignedTo?.teamId === user.teamId);
      if (!hasAccess) {
        return res.status(403).json({ status: 'fail', message: 'Access denied: Customer out of team scope' });
      }
    }

    const {
      fullName,
      email,
      phone,
      panNumber,
      aadhaarNumber,
      dateOfBirth,
      address,
      employmentType,
      annualIncome,
      creditScore,
    } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (panNumber !== undefined) {
      const normPan = String(panNumber).trim().toUpperCase();
      if (normPan !== existing.panNumber) {
        const panExists = await prisma.customer.findUnique({ where: { panNumber: normPan } });
        if (panExists) {
          return res.status(409).json({
            status: 'fail',
            message: `A customer with PAN ${normPan} already exists.`,
          });
        }
      }
      updateData.panNumber = normPan;
    }
    if (aadhaarNumber !== undefined) updateData.aadhaarNumber = aadhaarNumber ? String(aadhaarNumber).trim() : null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (employmentType !== undefined) updateData.employmentType = employmentType;
    if (annualIncome !== undefined) updateData.annualIncome = annualIncome !== null && annualIncome !== '' ? parseFloat(annualIncome) : null;
    if (creditScore !== undefined) updateData.creditScore = creditScore !== null && creditScore !== '' ? parseInt(creditScore, 10) : null;

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      status: 'success',
      data: updatedCustomer,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
};
