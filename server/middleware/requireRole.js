const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Unauthorized. User authentication context missing.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: `Forbidden. Action requires role: ${allowedRoles.join(' or ')}. Yours: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = requireRole;
