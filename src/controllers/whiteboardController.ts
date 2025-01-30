// src/controllers/whiteboardController.ts
import { Request, Response } from 'express';
import {
  createWhiteboard,
  getWhiteboardById,
  updateWhiteboard,
  addParticipant,
  removeParticipant,
  revertToSnapshot,
  deleteWhiteboard,
  deleteSnapshot,
} from '../services/whiteboardService';
import Whiteboard from '../models/Whiteboard';

/**
 * Create
 */
export const createWhiteboardController = async (req: Request, res: Response) => {
  try {
    const { ownerId, title, description } = req.body;
    const wb = await createWhiteboard(ownerId, title, description);
     res.status(201).json(wb);
    return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
    return;
  }
};

/**
 * Get by ID
 */
export const getWhiteboardController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const wb = await getWhiteboardById(id);
    if (!wb) {
       res.status(404).json({ message: 'Whiteboard not found' });
       return;
    }
     res.status(200).json(wb);
        return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
     return;
  }
};

/**
 * Update strokes, optionally create snapshot
 */
export const updateWhiteboardController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { strokes, createSnapshot } = req.body;
    const wb = await updateWhiteboard(id, strokes, createSnapshot);
    if (!wb) {
       res.status(404).json({ message: 'Whiteboard not found' });
       return;
    }
     res.status(200).json(wb);
     return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
        return;
  }
};

/**
 * Add participant
 */
export const addParticipantController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // whiteboardId
    const { userId } = req.body;
    const wb = await addParticipant(id, userId);
     res.status(200).json(wb);
    return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
    return;
  }
};

/**
 * Remove participant
 */
export const removeParticipantController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const wb = await removeParticipant(id, userId);
     res.status(200).json(wb);
        return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
    return;
  }
};

/**
 * Revert to snapshot
 */
export const revertToSnapshotController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { snapshotId } = req.body;
    const wb = await revertToSnapshot(id, snapshotId);
     res.status(200).json(wb);
     return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
    return;
  }
};

/**
 * Delete whiteboard
 */
export const deleteWhiteboardController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteWhiteboard(id);
     res.status(200).json({ message: 'Whiteboard deleted successfully' });
        return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
     return;
  }
};

/**
 * e.g. getMyWhiteboards:  Return boards where user is owner or participant
 */
export const getMyWhiteboardsController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Unauthorized' });
         return;
    }
    const userId = req.user._id; // or however you store user ID
    const boards = await Whiteboard.find({
      $or: [{ owner: userId }, { participants: userId }],
    }).lean();
     res.status(200).json(boards);
     return;
  } catch (error: any) {
     res.status(400).json({ message: error.message });
        return;
  }
};


export const deleteSnapshotController = async (req: Request, res: Response) => {
    try {
      const { id, snapshotId } = req.params; // or you can pass snapshotId in req.body
      const wb = await deleteSnapshot(id, snapshotId);
      if (!wb) {
         res.status(404).json({ message: 'Whiteboard not found' });
            return;
      }
       res.status(200).json({
        message: 'Snapshot deleted successfully',
        whiteboard: wb
      });
      return;
    } catch (error: any) {
       res.status(400).json({ message: error.message });
        return;
    }
  };
  