// src/services/messageService.ts

import Message, { IMessage } from '../models/Message';
import User, { IUser } from '../models/User';
import { OnlineStatus } from '../types/enums';
import mongoose from 'mongoose';

interface CreateMessageInput {
  content: string;
  sender: string;
  receiver?: string; // Optional for group messages
  groupId?: string; // Optional for private messages
  fileUrl?: string;
}

interface AddReactionInput {
  messageId: string;
  userId: string;
  emoji: string;
}

interface EditMessageInput {
  messageId: string;
  userId: string;
  newContent: string;
}

interface DeleteMessageInput {
  messageId: string;
  userId: string;
}

interface SearchMessagesOptions {
  userId: string;
  query: string;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export const createMessage = async (input: CreateMessageInput): Promise<IMessage> => {
  const message = new Message(input);
  return await message.save();
};

export const getMessagesBetweenUsers = async (
  userId1: string,
  userId2: string
): Promise<IMessage[]> => {
  return await Message.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 },
    ],
  })
    .sort({ timestamp: 1 })
    .select('content sender receiver timestamp read fileUrl readBy reactions edited')
    .exec();
};

export const getGroupMessages = async (
  groupId: string,
  since?: Date
): Promise<IMessage[]> => {
  const query: any = { groupId };
  if (since) {
    query.timestamp = { $gte: since };
  }
  return await Message.find(query)
    .sort({ timestamp: 1 })
    .populate('sender', 'name email')
    .exec();
};

export const markMessagesAsRead = async (
  receiverId: string,
  senderId: string
): Promise<void> => {
  await Message.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      read: false,
    },
    { $set: { read: true }, $addToSet: { readBy: receiverId } }
  );
};

export const addReaction = async (input: AddReactionInput): Promise<IMessage | null> => {
  const { messageId, userId, emoji } = input;

  // Validate userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid userId');
  }

  const message = await Message.findById(messageId);
  if (message) {
    // Check if the user already reacted with the same emoji
    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === userId && r.emoji === emoji
    );
    if (!existingReaction) {
      message.reactions.push({ user: new mongoose.Types.ObjectId(userId), emoji });
      await message.save();
    }
    return message;
  }
  return null;
};


export const editMessage = async (input: EditMessageInput): Promise<IMessage | null> => {
  const { messageId, userId, newContent } = input;
  const message = await Message.findById(messageId);
  if (message && message.sender.toString() === userId) {
    message.content = newContent;
    message.edited = true;
    await message.save();
    return message;
  }
  return null;
};

export const deleteMessage = async (input: DeleteMessageInput): Promise<boolean> => {
  const { messageId, userId } = input;
  const message = await Message.findById(messageId);
  if (message && message.sender.toString() === userId) {
    await message.deleteOne();
    return true;
  }
  return false;
};

export const searchMessages = async (options: SearchMessagesOptions): Promise<IMessage[]> => {
  const { userId, query, page = 1, limit = 20, startDate, endDate } = options;

  // Find groups the user is part of
  const userGroups = await mongoose.model('Group').find({ members: userId }).select('_id');

  const searchQuery: any = {
    $and: [
      {
        $or: [
          { sender: userId },
          { receiver: userId },
          { groupId: { $in: userGroups.map((g: any) => g._id) } },
        ],
      },
      { content: { $regex: query, $options: 'i' } },
    ],
  };

  if (startDate || endDate) {
    searchQuery.timestamp = {};
    if (startDate) searchQuery.timestamp.$gte = new Date(startDate);
    if (endDate) searchQuery.timestamp.$lte = new Date(endDate);
  }

  return await Message.find(searchQuery)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .populate('groupId', 'name')
    .populate('reactions.user', 'name email')
    .exec();
};

export const setUserOnlineStatus = async (userId: string, status: OnlineStatus): Promise<IUser | null> => {
  if (!Object.values(OnlineStatus).includes(status)) {
    throw new Error('Invalid online status.');
  }
  return await User.findByIdAndUpdate(
    userId,
    { onlineStatus: status },
    { new: true }
  ).select('-password_hash');
};

export const getUserOnlineStatus = async (userId: string): Promise<OnlineStatus | null> => {
  const user = await User.findById(userId).select('onlineStatus').exec();
  return user ? user.onlineStatus : null;
};
