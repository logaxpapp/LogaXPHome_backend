// src/services/notificationService.ts
import mongoose from'mongoose';
import Notification, { INotification } from '../models/Notification';


interface CreateNotificationInput {
  type: string;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  data?: any;
}

export const createNotification = async (
  input: CreateNotificationInput
): Promise<INotification> => {
  try {
    const notification = new Notification(input);
    return await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotificationsForUser = async (userId: string): Promise<INotification[]> => {
  return await Notification.find({ recipient: userId })
    .populate('sender', 'name email') // Populate sender with name and email
    .sort({ timestamp: -1 })
    .exec();
};


export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await Notification.findByIdAndUpdate(notificationId, { read: true }).exec();
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany({ recipient: userId, read: false }, { read: true }).exec();
};
