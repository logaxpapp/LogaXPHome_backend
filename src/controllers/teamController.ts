import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import mongoose from 'mongoose';

import * as teamService from '../services/teamService';
import Team, { ITeam } from '../models/Team';
import { IUser } from '../models/User';
import { UserRole } from '../types/enums';

/**
 * Extend Express Request to have `user?: IUser`
 */
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Create a new Board Team (with a single Leader: the owner).
 * POST /api/teams
 * Body: { name, description? }
 */
export const createBoardTeamHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Must be logged in
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Team name is required' });
      return;
    }

    // 2) Create the board team
    const team = await teamService.createBoardTeam({
      name,
      description,
      ownerId: req.user._id, // The user's _id
    });

    res.status(201).json(team);
    return; // exit
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new team
 * - Must be Admin or Contractor
 */
export const createTeamHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;
    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized: No user in request.' });
      return;
    }

    const data: Partial<ITeam> = req.body;
    console.log('Create Team data', data);

    const team = await teamService.createTeam(ownerId.toString(), data);

    res.status(201).json(team);
    return; // exit
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create team', error: error.message });
  }
};

/**
 * Get all teams (admin) or only manager's teams
 * with optional search, filter, and pagination
 */
export const getTeamsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Unauthorized: No user found.' });
      return;
    }

    const { search, role, page = '1', limit = '10' } = req.query;

    const filters = {
      search: search as string | undefined,
      role: role as string | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    if (userRole === UserRole.Admin) {
      const data = await teamService.getAllTeamsWithFilters(filters);
      res.status(200).json(data);
      return;
    } else {
      const data = await teamService.getTeamsByManagerWithFilters(
        userId.toString(),
        filters
      );
      res.status(200).json(data);
      return;
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
};

/**
 * Get a specific team by ID
 * Must be the team owner or admin
 */
export const getTeamByIdHandler: RequestHandler = async (
  req: AuthRequest,
  res,
  next
): Promise<void> => {
  try {
    const ownerId = req.user?._id;
    const userRole = req.user?.role;
    const teamId = req.params.id;

    if (!ownerId || !userRole) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return; // stop
    }

    let team: ITeam | null = null;

    if (userRole === UserRole.Admin) {
      // If admin, fetch all teams, then find by ID
      const allTeamsResult = await teamService.getAllTeamsWithFilters({
        search: undefined,
        role: undefined,
        page: 1,
        limit: 9999,
      });
      team = allTeamsResult.teams.find((t) => t._id.toString() === teamId) || null;

      if (!team) {
        res.status(404).json({ message: 'Team not found or unauthorized.' });
        return;
      }

      res.status(200).json(team);
      return;
    } else {
      // normal user check
      team = await teamService.getTeamById(ownerId.toString(), teamId);
      if (!team) {
        res.status(404).json({ message: 'Team not found or unauthorized.' });
        return;
      }

      res.status(200).json(team);
      return;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update a team
 * Must be team owner or admin
 */
export const updateTeamHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;
    const userRole = req.user?.role;
    const teamId = req.params.id;
    const updates: Partial<ITeam> = req.body;

    if (!ownerId || !userRole) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }

    // If Admin, no need to check ownership
    if (userRole === UserRole.Admin) {
      const foundTeam = await Team.findById(teamId);
      if (!foundTeam) {
        res.status(404).json({ message: 'Team not found' });
        return;
      }
      // Merge updates
      Object.assign(foundTeam, updates);
      const saved = await foundTeam.save();
      res.status(200).json(saved);
      return;
    }

    // otherwise, normal approach
    const updatedTeam = await teamService.updateTeam(
      ownerId.toString(),
      teamId,
      updates
    );
    if (!updatedTeam) {
      res.status(404).json({ message: 'Team not found or unauthorized.' });
      return;
    }

    res.status(200).json(updatedTeam);
    return;
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update team', error: error.message });
  }
};

/**
 * Delete a team
 * Must be team owner or admin
 */
export const deleteTeamHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;
    const userRole = req.user?.role;
    const teamId = req.params.id;

    if (!ownerId || !userRole) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }

    if (userRole === UserRole.Admin) {
      // admin => do a direct remove
      const foundTeam = await Team.findById(teamId);
      if (!foundTeam) {
        res.status(404).json({ message: 'Team not found' });
        return;
      }
      await foundTeam.deleteOne();
      res.status(204).send();
      return;
    }

    // else normal approach
    const success = await teamService.deleteTeam(ownerId.toString(), teamId);
    if (!success) {
      res.status(404).json({ message: 'Team not found or unauthorized.' });
      return;
    }

    res.status(204).send();
    return;
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete team', error: error.message });
  }
};

/**
 * Add a member (SubContractor) to a team with a specific role
 * Must be team owner or admin
 */
export const addMemberToTeamHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;
    const userRole = req.user?.role;
    const teamId = req.params.id;
    const { memberId, role } = req.body;

    if (!ownerId || !userRole) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }
    if (!memberId || !role) {
      res.status(400).json({ message: 'Member ID and role are required.' });
      return;
    }

    const realOwnerId = userRole === UserRole.Admin
      ? ownerId.toString() // If admin, we won't strictly check "owner" in the service
      : ownerId.toString();

    const updatedTeam = await teamService.addMemberToTeam(
      realOwnerId,
      teamId,
      memberId,
      role
    );

    if (!updatedTeam) {
      res.status(404).json({ message: 'Team not found or unauthorized.' });
      return;
    }
    res.status(200).json(updatedTeam);
    return;
  } catch (error: any) {
    res.status(500).json({ 
      message: error.message // pass through the actual reason
    });
  }  
};

/**
 * Remove a member (SubContractor) from a team
 * Must be team owner or admin
 */
export const removeMemberFromTeamHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;
    const userRole = req.user?.role;
    const teamId = req.params.id;
    const { memberId } = req.body;

    if (!ownerId || !userRole) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }
    if (!memberId) {
      res.status(400).json({ message: 'Member ID is required.' });
      return;
    }

    const realOwnerId = userRole === UserRole.Admin
      ? ownerId.toString()
      : ownerId.toString();

    const updatedTeam = await teamService.removeMemberFromTeam(
      realOwnerId,
      teamId,
      memberId
    );

    if (!updatedTeam) {
      res.status(404).json({ message: 'Team not found or unauthorized.' });
      return;
    }

    res.status(200).json(updatedTeam);
    return;
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to remove member from team', error: error.message });
  }
};

/**
 * Update a member's role
 * Must be team owner or admin
 */
export const updateMemberRoleHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user?._id;
    const userRole = req.user?.role;
    const teamId = req.params.id;
    const { memberId, newRole } = req.body;

    if (!ownerId || !userRole) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }
    if (!memberId || !newRole) {
      res.status(400).json({ message: 'Member ID and new role are required.' });
      return;
    }

    const realOwnerId = userRole === UserRole.Admin
      ? ownerId.toString()
      : ownerId.toString();

    const updatedTeam = await teamService.updateMemberRole(
      realOwnerId,
      teamId,
      memberId,
      newRole
    );

    if (!updatedTeam) {
      res.status(404).json({ message: 'Team or member not found, or unauthorized.' });
      return;
    }

    res.status(200).json(updatedTeam);
    return;
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update member role', error: error.message });
  }
};
