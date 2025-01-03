// src\middlewares\authorizeBoardMembers.ts

import { Request, Response, NextFunction } from 'express';
import Board from '../models/Task/Board';
import { IUser } from '../models/User';
import mongoose from 'mongoose';
import { ITeam } from '../models/Team';

/**
 * Extending the Request interface to include the authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Type Guard to check if `team` is populated
 */
function isPopulatedTeam(team: mongoose.Types.ObjectId | ITeam): team is ITeam {
  return (team as ITeam).members !== undefined;
}

/**
 * Middleware to check if the user is a member of the team associated with the board
 */
export const verifyBoardMembership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      res.status(400).json({ message: 'Invalid Board ID' });
      return;
    }

    const board = await Board.findById(boardId).populate('team');

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // If user role is admin, skip membership check
    if (req.user.role === 'admin') {
      (req as any).board = board; // Attach board for further use
      return next();
    }

    const isMember =
      board.members.some(
        (member) => member.toString() === req.user!._id.toString()
      ) ||
      (isPopulatedTeam(board.team) &&
        board.team.members.some(
          (member) => member.user.toString() === req.user!._id.toString()
        ));

    if (!isMember) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Attach board to request for further handlers
    (req as any).board = board;

    next();
  } catch (error: any) {
    next(error);
  }
};


export const verifyTeamLeader = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      res.status(400).json({ message: 'Invalid Board ID' });
      return;
    }

    const board = await Board.findById(boardId).populate({
      path: 'team',
      populate: {
        path: 'members.user',
        select: 'role',
      },
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // If user role is admin, skip team leader check
    if (req.user.role === 'admin') {
      (req as any).board = board; // Attach board for further use
      return next();
    }

    if (!isPopulatedTeam(board.team)) {
      res.status(400).json({ message: 'Team is not populated' });
      return;
    }

    const teamMember = board.team.members.find(
      (member) =>
        (member.user as IUser)._id.toString() === req.user!._id.toString()
    );

    if (!teamMember || teamMember.role !== 'Leader') {
      res.status(403).json({ message: 'Only team leaders can perform this action' });
      return;
    }

    next();
  } catch (error: any) {
    next(error);
  }
};

