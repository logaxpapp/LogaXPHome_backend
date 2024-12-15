// src/controllers/messageController.ts

import { Request, Response } from 'express';
import {
  getMessagesBetweenUsers,
  createMessage,
  markMessagesAsRead,
  addReaction,
  editMessage,
  deleteMessage,
  searchMessages,
} from '../services/messageService';
import User, { IUser } from '../models/User';
import { setUserOnlineStatus, getUserOnlineStatus } from '../services/messageService';
import { OnlineStatus } from '../types/enums';
import { io } from '../app'; // Ensure io is exported from app.ts
import Message from '../models/Message';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// 1. Get conversation between authenticated user and another participant
export const getConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString(); // Non-null assertion
    const participantId = req.params.participantId;

    const messages = await getMessagesBetweenUsers(userId, participantId);
    res.status(200).json({ data: messages });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 2. Send a message (private or group)
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString(); // Non-null assertion
    const { content, receiver, groupId, fileUrl } = req.body;

    if (!content && !fileUrl) {
      res.status(400).json({ message: 'Content or file is required' });
      return;
    }

    const message = await createMessage({
      content,
      sender: userId,
      receiver,
      groupId,
      fileUrl,
    });

    if (receiver) {
      io.to(receiver).emit('private_message', {
        _id: message._id,
        content: message.content,
        sender: message.sender.toString(),
        receiver: message.receiver?.toString() || '',
        timestamp: message.timestamp,
        read: message.read,
        readBy: message.readBy,
        reactions: message.reactions,
        edited: message.edited,
        fileUrl: message.fileUrl,
      });
    }
    

    if (groupId) {
      // Emit message to the group via Socket.IO
      io.to(`group_${groupId}`).emit('group_message', {
        content: message.content,
        from: userId,
        timestamp: message.timestamp,
        messageId: message._id,
        fileUrl: message.fileUrl,
      });
    }

    res.status(201).json({ data: message });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 3. Mark messages as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString(); // Non-null assertion
    const participantId = req.params.participantId;

    await markMessagesAsRead(userId, participantId);

    // Notify sender that messages have been read
    io.to(participantId).emit('messages_read', { by: userId });

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 4. Add a reaction to a message
export const handleAddReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString(); // Non-null assertion
    const { messageId, emoji } = req.body;

    if (!messageId || !emoji) {
      res.status(400).json({ message: 'messageId and emoji are required' });
      return;
    }

    const message = await addReaction({ messageId, userId, emoji });

    if (message) {
      // Emit reaction to relevant users
      if (message.receiver) {
        io.to(message.receiver.toString()).emit('reaction_added', {
          messageId,
          userId,
          emoji,
        });
      }
      if (message.groupId) {
        io.to(`group_${message.groupId}`).emit('reaction_added', {
          messageId,
          userId,
          emoji,
        });
      }
      res.status(200).json({ data: message });
    } else {
      res.status(404).json({ message: 'Message not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 5. Edit a message
export const handleEditMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString(); // Non-null assertion
    const { messageId } = req.params;
    const { newContent } = req.body;

    if (!newContent) {
      res.status(400).json({ message: 'newContent is required' });
      return;
    }

    const message = await editMessage({ messageId, userId, newContent });

    if (message) {
      // Emit edited message to relevant users
      if (message.receiver) {
        io.to(message.receiver.toString()).emit('message_edited', {
          messageId,
          newContent,
        });
      }
      if (message.groupId) {
        io.to(`group_${message.groupId}`).emit('message_edited', {
          messageId,
          newContent,
        });
      }
      res.status(200).json({ data: message });
    } else {
      res.status(403).json({ message: 'Unauthorized or message not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 6. Delete a message
export const handleDeleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString(); // Non-null assertion
    const { messageId } = req.params;

    const success = await deleteMessage({ messageId, userId });

    if (success) {
      // Find the message to determine where to emit
      const message = await Message.findById(messageId);
      if (message) {
        if (message.receiver) {
          io.to(message.receiver.toString()).emit('message_deleted', { messageId });
        }
        if (message.groupId) {
          io.to(`group_${message.groupId}`).emit('message_deleted', { messageId });
        }
      }
      res.status(200).json({ message: 'Message deleted successfully' });
    } else {
      res.status(403).json({ message: 'Unauthorized or message not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// 7. Search messages
export const handleSearchMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString(); // Non-null assertion
    const { query, page, limit, startDate, endDate } = req.query;

    if (!query) {
      res.status(400).json({ message: 'Query parameter is required' });
      return;
    }

    const messages = await searchMessages({
      userId,
      query: query as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({ data: messages });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const updateOnlineStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const { onlineStatus } = req.body;

    // Validate the incoming onlineStatus
    if (!onlineStatus || !Object.values(OnlineStatus).includes(onlineStatus)) {
      res.status(400).json({ message: 'Invalid or missing onlineStatus.' });
      return;
    }

    // Update only the onlineStatus field
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { onlineStatus },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Emit the online status update to other users via Socket.IO
    req.app.get('io').emit('user_status_update', { userId, onlineStatus });

    // Respond with success
    res.status(200).json({ message: 'Online status updated.', onlineStatus });
    return;
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error.' });
    return;
  }
};

// Retrieve User Online Status
export const retrieveOnlineStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const onlineStatus = await getUserOnlineStatus(userId);
    if (onlineStatus) {
      res.status(200).json({ onlineStatus });
      return;
    }
    res.status(404).json({ message: 'User not found.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error.' });
  }
};

