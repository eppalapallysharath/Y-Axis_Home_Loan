const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: false, // Accessible to Next.js middleware / JS
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 15 * 60 * 1000, // 15 mins
};

/**
 * Format user object for JWT payload and response
 */
const formatUserPayload = (user) => {
  const teamId = user.teamId || (user.managedTeam ? user.managedTeam.id : null);
  const teamName = user.team ? user.team.name : (user.managedTeam ? user.managedTeam.name : null);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId,
    teamName,
    team: user.team || (user.managedTeam ? { id: user.managedTeam.id, name: user.managedTeam.name } : null),
  };
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        error: 'BadRequest',
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        team: { select: { id: true, name: true } },
        managedTeam: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        error: 'AccountDeactivated',
        message: 'Your account has been deactivated. Contact your administrator.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      });
    }

    const userPayload = formatUserPayload(user);
    const accessToken = signAccessToken(userPayload);
    const refreshToken = signRefreshToken(userPayload);

    // Hash refresh token for secure DB storage
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastLoginAt: new Date(),
      },
    });

    // Set Cookies
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);

    return res.status(200).json({
      status: 'success',
      accessToken,
      user: userPayload,
      data: {
        accessToken,
        user: userPayload,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'TokenMissing',
        message: 'No refresh token provided',
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch (tokenErr) {
      res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
      res.clearCookie('access_token', { path: '/' });
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'TokenExpired',
        message: 'Refresh token expired or invalid',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        team: { select: { id: true, name: true } },
        managedTeam: { select: { id: true, name: true } },
      },
    });

    if (!user || user.isActive === false || !user.refreshTokenHash) {
      res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
      res.clearCookie('access_token', { path: '/' });
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired session',
      });
    }

    const isValid = await bcrypt.compare(rawRefreshToken, user.refreshTokenHash);
    if (!isValid) {
      // Possible refresh token reuse/theft — invalidate session immediately
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
      res.clearCookie('access_token', { path: '/' });
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        error: 'InvalidToken',
        message: 'Invalid refresh token',
      });
    }

    // Rotate refresh token
    const userPayload = formatUserPayload(user);
    const newAccessToken = signAccessToken(userPayload);
    const newRefreshToken = signRefreshToken(userPayload);
    const newHash = await bcrypt.hash(newRefreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newHash },
    });

    res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.cookie('access_token', newAccessToken, ACCESS_COOKIE_OPTIONS);

    return res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
      user: userPayload,
      data: {
        accessToken: newAccessToken,
        user: userPayload,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user?.sub) {
      await prisma.user.update({
        where: { id: req.user.sub },
        data: { refreshTokenHash: null },
      });
    }

    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
    res.clearCookie('access_token', { path: '/' });

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: {
        team: { select: { id: true, name: true } },
        managedTeam: { select: { id: true, name: true } },
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        error: 'NotFound',
        message: 'User not found or inactive',
      });
    }

    const userPayload = formatUserPayload(user);

    return res.status(200).json({
      status: 'success',
      data: {
        ...userPayload,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  getMe,
};
