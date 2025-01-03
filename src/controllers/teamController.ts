// src/controllers/teamController.ts
import { Request, Response, NextFunction } from 'express';
import * as teamService from '../services/teamService';
import { ITeam } from '../models/Team';
import mongoose from 'mongoose';
import { createBoardTeam, addMemberToTeam } from '../services/teamService';
import { IUser } from '../models/User';


interface AuthRequest extends Request {
  user?: IUser;
}


/**
 * Create a new team
 * POST /api/teams
 * Body: { name, description? }
 */
export const createBoardTeamHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Must be logged in
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await createBoardTeam({
      name,
      description,
      ownerId: req.user._id,
    });
    return res.status(201).json(team);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new team
 */
export const createTeamHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?._id; // Assuming `authenticateJWT` adds `user` to `req`
    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }

    const data: Partial<ITeam> = req.body;
    console.log('Create Team data', data);

    const team = await teamService.createTeam(ownerId.toString(), data);

    res.status(201).json(team);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create team', error: error.message });
  }
};

/**
 * Get all teams managed by the authenticated manager with search, filter, and pagination
 */
export const getTeamsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }

    const { search, role, page = '1', limit = '10' } = req.query;

    const filters = {
      search: search as string | undefined,
      role: role as string | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const teamsData =
      userRole === 'admin'
        ? await teamService.getAllTeamsWithFilters(filters) // Admin can see all teams
        : await teamService.getTeamsByManagerWithFilters(userId.toString(), filters); // Manager sees their own teams

    res.status(200).json(teamsData);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
};


/**
 * Get a specific team by ID
 */
export const getTeamByIdHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?._id;
    const teamId = req.params.id;

    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
    }

    const team = await teamService.getTeamById(ownerId.toString(), teamId);

    if (!team) {
      res.status(404).json({ message: 'Team not found.' });
      return;
    }

    res.status(200).json(team);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch team', error: error.message });
  }
};

/**
 * Update a team
 */
export const updateTeamHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?._id;
    const teamId = req.params.id;
    const updates: Partial<ITeam> = req.body;

    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
    }

    const updatedTeam = await teamService.updateTeam(ownerId.toString(), teamId, updates);

    if (!updatedTeam) {
      res.status(404).json({ message: 'Team not found or unauthorized.' });
        return;
    }

    res.status(200).json(updatedTeam);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update team', error: error.message });
  }
};

/**
 * Delete a team
 */
export const deleteTeamHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?._id;
    const teamId = req.params.id;

    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }

    const success = await teamService.deleteTeam(ownerId.toString(), teamId);

    if (!success) {
      res.status(404).json({ message: 'Team not found or unauthorized.' });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete team', error: error.message });
  }
};

/**
 * Add a member (SubContractor) to a team with a specific role
 */
export const addMemberToTeamHandler = async (req: Request, res: Response) => {
    try {
      const ownerId = req.user?._id;
      const teamId = req.params.id;
      const { memberId, role } = req.body;
  
      if (!ownerId) {
        res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
      }
  
      if (!memberId || !role) {
        res.status(400).json({ message: 'Member ID and role are required.' });
        return;
      }
  
      const updatedTeam = await teamService.addMemberToTeam(ownerId.toString(), teamId, memberId, role);
  
      if (!updatedTeam) {
        res.status(404).json({ message: 'Team not found or unauthorized.' });
        return;
      }
  
      res.status(200).json(updatedTeam);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to add member to team', error: error.message });
    }
  };

/**
 * Remove a member (SubContractor) from a team
 */
export const removeMemberFromTeamHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?._id;
    const teamId = req.params.id;
    const { memberId } = req.body;

    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }

    if (!memberId) {
      res.status(400).json({ message: 'Member ID is required.' });
      return;
    }

    const updatedTeam = await teamService.removeMemberFromTeam(ownerId.toString(), teamId, memberId);

    if (!updatedTeam) {
      res.status(404).json({ message: 'Team not found or unauthorized.' });
      return;
    }

    res.status(200).json(updatedTeam);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to remove member from team', error: error.message });
  }
};


/**
 * Update a member's role in a team
 */
export const updateMemberRoleHandler = async (req: Request, res: Response) => {
    try {
      const ownerId = req.user?._id;
      const teamId = req.params.id;
      const { memberId, newRole } = req.body;
  
      if (!ownerId) {
        res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
      }
  
      if (!memberId || !newRole) {
        res.status(400).json({ message: 'Member ID and new role are required.' });
        return;
      }
  
      const updatedTeam = await teamService.updateMemberRole(ownerId.toString(), teamId, memberId, newRole);
  
      if (!updatedTeam) {
        res.status(404).json({ message: 'Team or member not found, or unauthorized.' });
        return;
      }
  
      res.status(200).json(updatedTeam);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to update member role', error: error.message });
    }
  };
  