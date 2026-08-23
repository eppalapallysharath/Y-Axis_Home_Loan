/**
 * Middleware that injects data scope rules into `req.scope` based on user role:
 *  - ADMIN: req.scope = {} (global)
 *  - MANAGER: req.scope = { teamId: req.user.teamId }
 *  - EXECUTIVE: req.scope = { assignedToId: req.user.sub }
 */
const requireTeamScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Unauthorized. User authentication context missing.',
    });
  }

  const { role, sub: userId, teamId } = req.user;

  if (role === 'ADMIN') {
    req.scope = {};
  } else if (role === 'MANAGER') {
    req.scope = { teamId: teamId || null };
  } else if (role === 'EXECUTIVE') {
    req.scope = { assignedToId: userId };
  } else {
    req.scope = { assignedToId: -1 }; // fail-safe no access
  }

  next();
};

module.exports = requireTeamScope;
