import express, { Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateCreateGroup } from '../validators/validateCreateGroup';
import {
  createGroup,
  addMember,
  removeMember,
  getGroupDetails,
  getUserGroups,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController';
import mongoose from 'mongoose';

const router = express.Router();

// Middleware to validate ObjectId for groupId
function validateObjectId(req: Request, res: Response, next: NextFunction) {
  const { groupId } = req.params;
  if (groupId && !mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: 'Invalid group ID' });
    return;
  }
  next();
}

// Create a new group with enhanced validation
router.post('/', authenticateJWT, validateCreateGroup, createGroup);

// Add a member to a group
router.post('/:groupId/members', authenticateJWT, validateObjectId, addMember);

// Remove a member from a group
router.delete('/:groupId/members/:memberId', authenticateJWT, validateObjectId, removeMember);

// Get groups for the authenticated user
router.get('/', authenticateJWT, getUserGroups);

// Get group details
router.get('/:groupId', authenticateJWT, validateObjectId, getGroupDetails);

router.put('/:groupId', authenticateJWT, updateGroup);
router.delete('/:groupId', authenticateJWT, deleteGroup);


export default router;
