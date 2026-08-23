const WORK_ITEM_TYPES = [
  'CIBIL_CHECK',
  'DOCUMENT_VERIFICATION',
  'LEGAL_TITLE_SEARCH',
  'PROPERTY_VALUATION',
  'FINAL_REVIEW',
  'OTHER',
];

const WORK_ITEM_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];

const validateCreateWorkItem = (req, res, next) => {
  const { type, title, description, assignedToId } = req.body;

  if (!type || !WORK_ITEM_TYPES.includes(type)) {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: `Invalid or missing type. Must be one of: ${WORK_ITEM_TYPES.join(', ')}`,
    });
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'Work item title is required.',
    });
  }

  if (title.length > 200) {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'Work item title cannot exceed 200 characters.',
    });
  }

  if (description && (typeof description !== 'string' || description.length > 2000)) {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'Work item description must be a string up to 2000 characters.',
    });
  }

  if (assignedToId !== undefined && assignedToId !== null && isNaN(parseInt(assignedToId, 10))) {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'assignedToId must be a valid integer ID.',
    });
  }

  next();
};

const validateUpdateWorkItem = (req, res, next) => {
  const { status, title, description, assignedToId } = req.body;

  if (status && !WORK_ITEM_STATUSES.includes(status)) {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: `Invalid status. Must be one of: ${WORK_ITEM_STATUSES.join(', ')}`,
    });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(422).json({
        status: 'error',
        statusCode: 422,
        errorType: 'ValidationError',
        message: 'Work item title cannot be empty.',
      });
    }
    if (title.length > 200) {
      return res.status(422).json({
        status: 'error',
        statusCode: 422,
        errorType: 'ValidationError',
        message: 'Work item title cannot exceed 200 characters.',
      });
    }
  }

  if (description !== undefined && description !== null && (typeof description !== 'string' || description.length > 2000)) {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'Work item description must be a string up to 2000 characters.',
    });
  }

  if (assignedToId !== undefined && assignedToId !== null && isNaN(parseInt(assignedToId, 10))) {
    return res.status(422).json({
      status: 'error',
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'assignedToId must be a valid integer ID or null.',
    });
  }

  next();
};

module.exports = {
  WORK_ITEM_TYPES,
  WORK_ITEM_STATUSES,
  validateCreateWorkItem,
  validateUpdateWorkItem,
};
