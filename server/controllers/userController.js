const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');

/**
 * POST /api/v1/admin/users
 * Create a new user (and Team if creating a Manager)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, teamName, teamId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Name, email, password, and role are required.',
      });
    }

    if (!['ADMIN', 'MANAGER', 'EXECUTIVE'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Role must be ADMIN, MANAGER, or EXECUTIVE.',
      });
    }

    if (role === 'MANAGER' && !teamName) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Team Name is required when creating a Manager account.',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: `A user with email ${email} already exists.`,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let newUser;
    if (role === 'MANAGER') {
      // Create user -> create team -> link team to user
      newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: 'MANAGER',
          },
        });

        const team = await tx.team.create({
          data: {
            name: teamName.trim(),
            managerId: user.id,
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { teamId: team.id },
          include: { managedTeam: true, team: true },
        });

        return updatedUser;
      });
    } else if (role === 'EXECUTIVE') {
      const parsedTeamId = teamId ? parseInt(teamId, 10) : null;
      if (parsedTeamId) {
        const teamExists = await prisma.team.findUnique({ where: { id: parsedTeamId } });
        if (!teamExists) {
          return res.status(400).json({
            status: 'error',
            statusCode: 400,
            message: `Selected Team #${parsedTeamId} does not exist.`,
          });
        }
      }

      newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'EXECUTIVE',
          teamId: parsedTeamId,
        },
        include: { team: true },
      });
    } else {
      // ADMIN
      newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'ADMIN',
        },
      });
    }

    return res.status(201).json({
      status: 'success',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        teamId: newUser.teamId,
        teamName: newUser.team ? newUser.team.name : (newUser.managedTeam ? newUser.managedTeam.name : null),
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/users
 * List users (ADMIN sees all, MANAGER sees team members)
 */
const listUsers = async (req, res, next) => {
  try {
    const { role, teamId: userTeamId } = req.user;
    let where = {};

    if (role === 'MANAGER') {
      if (!userTeamId) {
        return res.status(200).json({ status: 'success', data: [] });
      }
      where = { teamId: userTeamId };
    } else if (role === 'EXECUTIVE') {
      if (userTeamId) {
        where = { teamId: userTeamId };
      }
    }

    if (req.query.role) {
      where.role = req.query.role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        team: {
          select: { id: true, name: true },
        },
        managedTeam: {
          select: { id: true, name: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      teamId: u.teamId || (u.managedTeam ? u.managedTeam.id : null),
      teamName: u.team ? u.team.name : (u.managedTeam ? u.managedTeam.name : 'Unassigned'),
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedUsers,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/teams
 * List all branch teams
 */
const listTeams = async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        members: {
          where: { role: 'EXECUTIVE' },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedTeams = teams.map((t) => ({
      id: t.id,
      name: t.name,
      managerId: t.managerId,
      managerName: t.manager ? t.manager.name : 'Unassigned',
      memberCount: t.members.length,
      createdAt: t.createdAt,
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedTeams,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  listUsers,
  listTeams,
};
