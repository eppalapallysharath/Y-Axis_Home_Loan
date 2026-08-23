const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const envConfig = require('../config/env.config');

const JWT_ACCESS_SECRET = envConfig.jwtAccessSecret;
const JWT_REFRESH_SECRET = envConfig.jwtRefreshSecret;
const JWT_ACCESS_EXPIRES_IN = envConfig.jwtAccessExpiresIn;
const JWT_REFRESH_EXPIRES_IN = envConfig.jwtRefreshExpiresIn;

/**
 * Sign Access Token (short-lived, stored in memory)
 * Payload: { sub: userId, name, email, role, teamId }
 */
const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId || null,
    },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Sign Refresh Token (long-lived, HttpOnly cookie)
 * Payload: { sub: userId, role }
 */
const signRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Generate a random 64-byte hex string refresh token
 */
const generateOpaqueRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET);
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  generateOpaqueRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

