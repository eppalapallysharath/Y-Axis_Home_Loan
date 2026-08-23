const { verifyAccessToken } = require('../utils/jwt');

const requireAuth = (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded; // { sub, name, email, role, teamId }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'TokenExpired',
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired. Please refresh your session.',
      });
    }
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      error: 'InvalidToken',
      message: 'Invalid authorization token.',
    });
  }
};

module.exports = requireAuth;
