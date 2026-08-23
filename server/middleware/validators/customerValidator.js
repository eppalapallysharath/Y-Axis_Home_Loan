/**
 * Customer Request Validators
 */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const AADHAAR_REGEX = /^\d{12}$/;
const VALID_EMPLOYMENT_TYPES = [
  'SALARIED',
  'SELF_EMPLOYED',
  'BUSINESS_OWNER',
  'RETIRED',
  'OTHER',
];

const validateCreateCustomer = (req, res, next) => {
  const errors = [];
  const {
    fullName,
    email,
    phone,
    panNumber,
    aadhaarNumber,
    dateOfBirth,
    employmentType,
    annualIncome,
    creditScore,
  } = req.body || {};

  // Full Name validation
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  } else {
    const trimmed = fullName.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      errors.push({ field: 'fullName', message: 'Full name must be between 2 and 100 characters' });
    } else if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
      errors.push({ field: 'fullName', message: 'Full name must contain only letters and spaces' });
    }
  }

  // Email validation
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Phone validation
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!PHONE_REGEX.test(phone.trim())) {
    errors.push({ field: 'phone', message: 'Phone must be exactly 10 digits' });
  }

  // PAN Number validation
  if (!panNumber || typeof panNumber !== 'string' || !panNumber.trim()) {
    errors.push({ field: 'panNumber', message: 'PAN number is required' });
  } else {
    const upperPan = panNumber.trim().toUpperCase();
    if (!PAN_REGEX.test(upperPan)) {
      errors.push({ field: 'panNumber', message: 'Invalid PAN format (e.g. ABCDE1234F)' });
    }
    req.body.panNumber = upperPan; // Normalize to uppercase
  }

  // Aadhaar Number validation (optional)
  if (aadhaarNumber !== undefined && aadhaarNumber !== null && aadhaarNumber !== '') {
    if (!AADHAAR_REGEX.test(String(aadhaarNumber).trim())) {
      errors.push({ field: 'aadhaarNumber', message: 'Aadhaar number must be exactly 12 digits' });
    }
  }

  // Date of Birth validation (optional)
  if (dateOfBirth) {
    const dobDate = new Date(dateOfBirth);
    if (isNaN(dobDate.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Invalid date format for date of birth' });
    } else {
      const ageInYears = (Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageInYears < 18) {
        errors.push({ field: 'dateOfBirth', message: 'Applicant must be at least 18 years old' });
      }
    }
  }

  // Employment Type validation
  if (!employmentType) {
    errors.push({ field: 'employmentType', message: 'Employment type is required' });
  } else if (!VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
    errors.push({
      field: 'employmentType',
      message: `Employment type must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`,
    });
  }

  // Annual Income validation (optional)
  if (annualIncome !== undefined && annualIncome !== null && annualIncome !== '') {
    const incomeNum = Number(annualIncome);
    if (isNaN(incomeNum) || incomeNum < 0) {
      errors.push({ field: 'annualIncome', message: 'Annual income must be a positive number' });
    }
  }

  // Credit Score validation (optional)
  if (creditScore !== undefined && creditScore !== null && creditScore !== '') {
    const scoreNum = Number(creditScore);
    if (!Number.isInteger(scoreNum) || scoreNum < 300 || scoreNum > 900) {
      errors.push({ field: 'creditScore', message: 'Credit score must be an integer between 300 and 900' });
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({
      status: 'fail',
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validateUpdateCustomer = (req, res, next) => {
  const errors = [];
  const {
    fullName,
    email,
    phone,
    panNumber,
    aadhaarNumber,
    dateOfBirth,
    employmentType,
    annualIncome,
    creditScore,
  } = req.body || {};

  if (fullName !== undefined) {
    if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length < 2 || fullName.trim().length > 100) {
      errors.push({ field: 'fullName', message: 'Full name must be between 2 and 100 characters' });
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  if (phone !== undefined) {
    if (!PHONE_REGEX.test(String(phone).trim())) {
      errors.push({ field: 'phone', message: 'Phone must be exactly 10 digits' });
    }
  }

  if (panNumber !== undefined) {
    const upperPan = String(panNumber).trim().toUpperCase();
    if (!PAN_REGEX.test(upperPan)) {
      errors.push({ field: 'panNumber', message: 'Invalid PAN format (e.g. ABCDE1234F)' });
    }
    req.body.panNumber = upperPan;
  }

  if (aadhaarNumber !== undefined && aadhaarNumber !== null && aadhaarNumber !== '') {
    if (!AADHAAR_REGEX.test(String(aadhaarNumber).trim())) {
      errors.push({ field: 'aadhaarNumber', message: 'Aadhaar number must be exactly 12 digits' });
    }
  }

  if (dateOfBirth) {
    const dobDate = new Date(dateOfBirth);
    if (isNaN(dobDate.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Invalid date format' });
    }
  }

  if (employmentType !== undefined) {
    if (!VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
      errors.push({ field: 'employmentType', message: 'Invalid employment type' });
    }
  }

  if (annualIncome !== undefined && annualIncome !== null && annualIncome !== '') {
    const incomeNum = Number(annualIncome);
    if (isNaN(incomeNum) || incomeNum < 0) {
      errors.push({ field: 'annualIncome', message: 'Annual income must be a positive number' });
    }
  }

  if (creditScore !== undefined && creditScore !== null && creditScore !== '') {
    const scoreNum = Number(creditScore);
    if (!Number.isInteger(scoreNum) || scoreNum < 300 || scoreNum > 900) {
      errors.push({ field: 'creditScore', message: 'Credit score must be between 300 and 900' });
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({
      status: 'fail',
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
};
