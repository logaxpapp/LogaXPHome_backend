import { Request, Response } from 'express';
import { getGroupMessages } from '../services/messageService'; // Use from messageService
import { IUser } from '../models/User';
import Group from '../models/Group';
import mongoose from 'mongoose'; // Ensure mongoose is imported

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const getGroupConversation = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id.toString(); // Convert ObjectId to string
    const { groupId } = req.params;

    // Validate groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({ message: 'Invalid group ID' });
      return;
    }

    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    // Convert ObjectId array to string array for comparison
    const memberIds = group.members.map((id) => id.toString());

    if (!userId || !memberIds.includes(userId)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Fetch messages using the unified message service
    const messages = await getGroupMessages(groupId);

    res.status(200).json({ data: messages });
  } catch (error: any) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
