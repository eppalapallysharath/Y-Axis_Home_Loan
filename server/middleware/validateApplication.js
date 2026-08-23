const { prisma } = require('../config/db');

const VALID_TYPES = ['HOME_LOAN', 'TOP_UP', 'LAP'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/**
 * Middleware to validate POST /api/v1/applications
 */
const validateCreateApplication = async (req, res, next) => {
  try {
    const { customerId, applicationType, loanAmount, propertyAddress, propertyValue, remarks, priority } = req.body;

    // customerId validation
    const parsedCustomerId = parseInt(customerId, 10);
    if (!customerId || isNaN(parsedCustomerId) || parsedCustomerId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid customerId is required.' });
    }

    // applicationType validation
    if (applicationType && !VALID_TYPES.includes(applicationType)) {
      return res.status(400).json({ status: 'error', message: `Invalid applicationType. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    // loanAmount validation
    const parsedLoanAmount = parseFloat(loanAmount);
    if (loanAmount === undefined || loanAmount === null || isNaN(parsedLoanAmount) || parsedLoanAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid positive loanAmount is required.' });
    }

    if (parsedLoanAmount < 100000) {
      return res.status(400).json({ status: 'error', message: 'Minimum loan amount is ₹1,00,000 (1 Lakh).' });
    }

    if (parsedLoanAmount > 100000000) {
      return res.status(400).json({ status: 'error', message: 'Maximum loan amount is ₹10,00,00,000 (10 Crore).' });
    }

    // propertyAddress validation
    if (propertyAddress && propertyAddress.length > 300) {
      return res.status(400).json({ status: 'error', message: 'propertyAddress cannot exceed 300 characters.' });
    }

    // propertyValue validation
    let parsedPropertyValue = null;
    if (propertyValue !== undefined && propertyValue !== null && propertyValue !== '') {
      parsedPropertyValue = parseFloat(propertyValue);
      if (isNaN(parsedPropertyValue) || parsedPropertyValue <= 0) {
        return res.status(400).json({ status: 'error', message: 'propertyValue must be a positive number.' });
      }
    }

    // LTV Check (Loan-to-Value <= 80%)
    if (parsedPropertyValue && parsedLoanAmount) {
      const ltv = (parsedLoanAmount / parsedPropertyValue) * 100;
      if (ltv > 80) {
        return res.status(422).json({
          status: 'error',
          error: 'Loan amount exceeds 80% LTV limit',
          message: `Loan ₹${parsedLoanAmount.toLocaleString('en-IN')} is ${ltv.toFixed(1)}% of property value ₹${parsedPropertyValue.toLocaleString('en-IN')}. Maximum allowed LTV is 80%.`,
        });
      }
    }

    // remarks validation
    if (remarks && remarks.length > 1000) {
      return res.status(400).json({ status: 'error', message: 'remarks cannot exceed 1000 characters.' });
    }

    // priority validation
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ status: 'error', message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to validate PATCH /api/v1/applications/:id
 */
const validateUpdateApplication = async (req, res, next) => {
  try {
    const { loanAmount, propertyValue, propertyAddress, priority, remarks } = req.body;

    if (loanAmount !== undefined && loanAmount !== null) {
      const parsedLoanAmount = parseFloat(loanAmount);
      if (isNaN(parsedLoanAmount) || parsedLoanAmount <= 0) {
        return res.status(400).json({ status: 'error', message: 'loanAmount must be a positive number.' });
      }
      if (parsedLoanAmount < 100000 || parsedLoanAmount > 100000000) {
        return res.status(400).json({ status: 'error', message: 'loanAmount must be between ₹1,00,000 and ₹10,00,00,000.' });
      }
    }

    if (propertyValue !== undefined && propertyValue !== null && propertyValue !== '') {
      const parsedPropertyValue = parseFloat(propertyValue);
      if (isNaN(parsedPropertyValue) || parsedPropertyValue <= 0) {
        return res.status(400).json({ status: 'error', message: 'propertyValue must be a positive number.' });
      }
    }

    if (propertyAddress && propertyAddress.length > 300) {
      return res.status(400).json({ status: 'error', message: 'propertyAddress cannot exceed 300 characters.' });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ status: 'error', message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    if (remarks && remarks.length > 1000) {
      return res.status(400).json({ status: 'error', message: 'remarks cannot exceed 1000 characters.' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

const VALID_STAGES = [
  'NEW',
  'WAITING_FOR_INFO',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'COMPLETED',
  'REJECTED',
];

/**
 * Middleware to validate PATCH /api/v1/applications/:id/stage
 */
const validateStageTransition = async (req, res, next) => {
  try {
    const { toStage, rejectionReason } = req.body;

    if (!toStage || !VALID_STAGES.includes(toStage)) {
      return res.status(400).json({
        status: 'error',
        error: 'ValidationError',
        message: `Valid toStage is required. Must be one of: ${VALID_STAGES.join(', ')}`,
      });
    }

    if (toStage === 'REJECTED') {
      if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim() === '') {
        return res.status(422).json({
          status: 'error',
          error: 'ValidationError',
          message: 'A rejection reason is required when rejecting an application.',
        });
      }
    }

    if (rejectionReason && rejectionReason.length > 500) {
      return res.status(400).json({
        status: 'error',
        error: 'ValidationError',
        message: 'rejectionReason cannot exceed 500 characters.',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateCreateApplication,
  validateUpdateApplication,
  validateStageTransition,
};

