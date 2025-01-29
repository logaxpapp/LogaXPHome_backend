// src/utils/socketHandler.ts

import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Group from '../models/Group';
import { createMessage } from '../services/messageService';
import Message from '../models/Message';
import { OnlineStatus } from '../types/enums';

// Whiteboard logic
import Whiteboard from '../models/Whiteboard';
import { updateWhiteboard } from '../services/whiteboardService';

export const initializeSocket = (io: SocketIOServer) => {
  // Online users
  const onlineUsers = new Set<string>();

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as any).user = user; // Attach user to socket
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as IUser;
    onlineUsers.add(user._id.toString());
    console.log(`User connected: ${user.name} (${user._id})`);

    // **Update user's onlineStatus field to 'online'**
    User.findByIdAndUpdate(user._id, { onlineStatus: OnlineStatus.Online }).exec();
    io.emit('user_status_update', { userId: user._id.toString(), onlineStatus: OnlineStatus.Online });

    // Notify other users that this user is online
    socket.broadcast.emit('user_online', user._id.toString());

    // Join the user to a room identified by their user ID
    socket.join(user._id.toString());

    // Join the user to all their group rooms
    Group.find({ members: user._id })
      .then((groups) => {
        groups.forEach((group) => {
          socket.join(`group_${group._id}`);
        });
      })
      .catch((error) => {
        console.error('Error joining group rooms:', error);
      });

    /**
     * 1. Typing Indicators
     */
    socket.on('typing', (data) => {
      const { to, groupId } = data;
      if (to) {
        io.to(to).emit('typing', { from: user._id.toString() });
      }
      if (groupId) {
        io.to(`group_${groupId}`).emit('typing', { from: user._id.toString(), groupId });
      }
    });

    socket.on('stop_typing', (data) => {
      const { to, groupId } = data;
      if (to) {
        io.to(to).emit('stop_typing', { from: user._id.toString() });
      }
      if (groupId) {
        io.to(`group_${groupId}`).emit('stop_typing', { from: user._id.toString(), groupId });
      }
    });

    /**
     * 2. Handle private messages
     */
    socket.on('private_message', async (data) => {
      const { content, to, fileUrl } = data;

      if (!content && !fileUrl) {
        return socket.emit('error', 'Content or file is required');
      }

      // Check if the receiver has blocked the sender
      const receiver = await User.findById(to);
      if (receiver && receiver.blockedUsers.includes(user._id)) {
        return socket.emit('error', 'You are blocked by this user.');
      }

      // Save message to database
      const message = await createMessage({
        content,
        sender: user._id.toString(),
        receiver: to,
        fileUrl,
      });

      // Emit message to the receiver
      io.to(to).emit('private_message', {
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
    });

   /**
     * Handle sending group messages
     * Client should emit: socket.emit('group_message', { content, groupId, fileUrl? });
     */
   socket.on('group_message', async (data) => {
    const { content, groupId, fileUrl } = data;
  
    if (!content && !fileUrl) {
      return socket.emit('error', 'Content or file is required');
    }
  
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(user._id)) {
      return socket.emit('error', 'You are not a member of this group.');
    }
  
    const message = await createMessage({
      content,
      sender: user._id.toString(),
      groupId,
      fileUrl,
    });
  
    // Populate to include sender info
    const savedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profile_picture_url role')
      .exec();
  
  if (!savedMessage || !savedMessage.sender) {
    // If for some reason the message or sender is not found, 
   // just return without emitting.
    return;
   }
  
   // At this point, savedMessage.sender is a populated IUser, so we can assert its type
   const populatedSender = savedMessage.sender as IUser;
  
    io.to(`group_${groupId}`).emit('group_message', {
      _id: savedMessage._id,
      content: savedMessage.content,
      sender: {
        _id: populatedSender._id.toString(),
        name: populatedSender.name,
        email: populatedSender.email,
        profile_picture_url: populatedSender.profile_picture_url || '',
        role: populatedSender.role,
      },
      timestamp: savedMessage.timestamp,
      fileUrl: savedMessage.fileUrl,
      groupId: groupId,
      read: savedMessage.read,
      reactions: savedMessage.reactions,
      edited: savedMessage.edited,
    });
  });
  

    /**
     * 4. Read Receipts
     */
    socket.on('message_read', async (data) => {
      const { messageId } = data;

      const message = await Message.findById(messageId);
      if (message) {
        // Add the user to readBy array if not already present
        if (!message.readBy.includes(user._id)) {
          message.readBy.push(user._id);
          // If all recipients have read, mark as read
          if (message.groupId) {
            const group = await Group.findById(message.groupId);
            if (group) {
              const allRead = group.members.every((memberId) => message.readBy.includes(memberId));
              if (allRead) {
                message.read = true;
              }
            }
          } else if (message.receiver) {
            message.read = true;
          }
          await message.save();

          // Notify the sender
          io.to(message.sender.toString()).emit('message_read', {
            messageId,
            by: user._id.toString(),
          });
        }
      }
    });

    /**
     * 5. Message Reactions/Emojis
     */
    socket.on('add_reaction', async (data) => {
      const { messageId, emoji } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', 'Message not found.');
      }

      // Check if user has already reacted with the same emoji
      const existingReaction = message.reactions.find(
        (r) => r.user.toString() === user._id.toString() && r.emoji === emoji
      );
      if (!existingReaction) {
        message.reactions.push({ user: user._id, emoji });
        await message.save();

        // Emit reaction to relevant users
        if (message.receiver) {
          io.to(message.receiver.toString()).emit('reaction_added', {
            messageId,
            userId: user._id.toString(),
            emoji,
          });
        }
        if (message.groupId) {
          io.to(`group_${message.groupId}`).emit('reaction_added', {
            messageId,
            userId: user._id.toString(),
            emoji,
          });
        }
      }
    });

    /**
     * 6. Message Editing
     */
    socket.on('edit_message', async (data) => {
      const { messageId, newContent } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', 'Message not found.');
      }

      if (message.sender.toString() !== user._id.toString()) {
        return socket.emit('error', 'Unauthorized to edit this message.');
      }

      message.content = newContent;
      message.edited = true;
      await message.save();

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
    });

    /**
     * 7. Message Deletion
     */
    socket.on('delete_message', async (data) => {
      const { messageId } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', 'Message not found.');
      }

      if (message.sender.toString() !== user._id.toString()) {
        return socket.emit('error', 'Unauthorized to delete this message.');
      }

      await message.deleteOne();

      // Emit deletion to relevant users
      if (message.receiver) {
        io.to(message.receiver.toString()).emit('message_deleted', { messageId });
      }
      if (message.groupId) {
        io.to(`group_${message.groupId}`).emit('message_deleted', { messageId });
      }
    });

     /**
     * Handle typing indicators in groups
     * Client should emit: socket.emit('typing', { groupId: someId });
     */
     socket.on('typing', (data) => {
      const { groupId } = data;
      if (groupId) {
        // Broadcast to all group members that this user is typing
        io.to(`group_${groupId}`).emit('typing', {
          from: user._id.toString(),
          groupId,
        });
      }
    });

    socket.on('stop_typing', (data) => {
      const { groupId } = data;
      if (groupId) {
        // Broadcast to all group members that this user stopped typing
        io.to(`group_${groupId}`).emit('stop_typing', {
          from: user._id.toString(),
          groupId,
        });
      }
    });

    /**
     * 8. User Presence and Status Indicators
     */
    socket.on('update_online_status', async (data) => {
      const { onlineStatus } = data;
      const validStatuses = Object.values(OnlineStatus);
      if (!validStatuses.includes(onlineStatus)) {
        return socket.emit('error', 'Invalid online status.');
      }

      user.onlineStatus = onlineStatus as OnlineStatus;
      await user.save();

      // Broadcast online status update
      io.emit('user_status_update', { userId: user._id.toString(), onlineStatus });
    });

    /**
     * =========================
     * Whiteboard Collaboration
     * =========================
     */

    socket.on('join_whiteboard', (data) => {
      const { whiteboardId } = data;
      // Optional: check if user has permission to see whiteboard
      socket.join(`whiteboard_${whiteboardId}`);
      console.log(`User ${user._id} joined whiteboard_${whiteboardId}`);
    });

    /**
     * Listen for strokes & version from front end
     */
    socket.on('whiteboard_update', async (data) => {
      try {
        const { whiteboardId, strokes, clientVersion } = data;
        // Load from DB
        const wb = await Whiteboard.findById(whiteboardId);
        if (!wb) {
          return socket.emit('error', 'Whiteboard not found');
        }

        // Basic concurrency check
        if (clientVersion !== wb.version) {
          return socket.emit('whiteboard_conflict', {
            serverVersion: wb.version,
            serverStrokes: wb.strokes,
          });
        }

        // Update
        const updated = await updateWhiteboard(whiteboardId, strokes, false);
        if (!updated) {
          return socket.emit('error', 'Failed to update whiteboard');
        }

        // Broadcast new strokes + new version to all participants
        io.to(`whiteboard_${whiteboardId}`).emit('whiteboard_update', {
          strokes: updated.strokes,
          version: updated.version,
        });
      } catch (err) {
        console.error('whiteboard_update error:', err);
        socket.emit('error', 'Failed to update whiteboard');
      }
    });

    // Example revert (client emits 'whiteboard_revert')
    socket.on('whiteboard_revert', async (data) => {
      // Or call revertToSnapshot in service, then broadcast
      // ...
    });


    // Handle disconnection
    socket.on('disconnect', async () => {
      onlineUsers.delete(user._id.toString());
      console.log(`User disconnected: ${user.name} (${user._id}), Socket ID: ${socket.id}`);

      // **Update user's onlineStatus field to 'offline'**
      await User.findByIdAndUpdate(user._id, { onlineStatus: OnlineStatus.Offline }).exec();
      io.emit('user_status_update', { userId: user._id.toString(), onlineStatus: OnlineStatus.Offline });

      // Notify other users that this user is offline
      socket.broadcast.emit('user_offline', user._id.toString());
    });
  });
};


