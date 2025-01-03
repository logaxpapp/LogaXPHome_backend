// src/services/Task/commentService.ts

import Comment, { IComment } from '../../models/Task/Comment';
import Card, { ICard } from '../../models/Task/Card';
import Activity, { ActivityType } from '../../models/Task/Activity';
import User from '../../models/User';
import { IUser } from '../../models/User';
import mongoose from 'mongoose';

/**
 * Placeholder function to notify users
 * Implement this according to your notification system (e.g., email, real-time notifications)
 */
const notifyUser = (userId: string, message: string) => {
  // Implementation goes here
  console.log(`Notify User ${userId}: ${message}`);
};

/**
 * Create a new Comment
 */
interface CreateCommentInput {
  cardId: string;
  content: string;
  parentCommentId?: string;
}

export const createComment = async (
    input: CreateCommentInput,
    user: IUser
  ): Promise<IComment> => {
    const { cardId, content, parentCommentId } = input;
  
    const mentionRegex = /@(\w+)/g;
    const mentionedUsernames: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedUsernames.push(match[1]);
    }
  
    const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } });
    const mentionedUserIds = mentionedUsers.map((u) => u._id);
  
    const comment = new Comment({
      card: cardId,
      author: user._id, // Directly referencing user._id
      content,
      parentComment: parentCommentId,
      mentions: mentionedUserIds,
    });
  
    const savedComment = await comment.save();
    await savedComment.populate('author');
  
    await Card.findByIdAndUpdate(cardId, { $push: { comments: savedComment._id } });
  
    await Activity.create({
      board: (await Card.findById(cardId))?.list,
      card: cardId,
      user: user._id, // Directly referencing user._id
      type: parentCommentId ? ActivityType.Replied : ActivityType.Commented,
      details: parentCommentId
        ? `Replied to comment: "${savedComment.content}"`
        : `Commented: "${savedComment.content}"`,
    });
  
    mentionedUserIds.forEach((mentionedUserId) => {
      notifyUser(mentionedUserId.toString(), `You were mentioned in a comment.`);
    });
  
    return savedComment;
  };
  

/**
 * Edit an existing Comment
 */
export const editComment = async (
    commentId: string,
    updates: Partial<{ content: string }>, // Only allow updating content
    user: IUser
  ): Promise<IComment> => {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found.');
  
    // Convert `comment.author` and `user._id` to strings for comparison
    const authorId = comment.author.toString();
    const userId = user._id.toString();
  
    // Ensure that only the author can edit their comment
    if (authorId !== userId) {
      throw new Error('Unauthorized to edit this comment.');
    }
  
    // Update the comment content
    if (updates.content !== undefined) {
      comment.content = updates.content;
    }
  
    const updatedComment = await comment.save();
  
    // Populate the author field
    await updatedComment.populate('author');
  
    // Log activity
    const card = await Card.findById(comment.card); // Retrieve the card for activity logging
    await Activity.create({
      board: card?.list, // Assuming card.list refers to the board
      card: comment.card,
      user: new mongoose.Types.ObjectId(user._id), // Ensure user ID is an ObjectId
      type: ActivityType.Edited,
      details: `Edited comment: "${updatedComment.content}"`,
    });
  
    return updatedComment;
  };
  
/**
 * Delete a Comment
 */
export const deleteComment = async (commentId: string, user: IUser): Promise<void> => {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found.');
  
    // Convert `user._id` and `comment.author` to strings for comparison
    const userId = user._id.toString();
    const authorId = comment.author.toString();
  
    // Ensure that only the author or admins can delete the comment
    if (authorId !== userId && !user.isAdmin) {
      throw new Error('Unauthorized to delete this comment.');
    }
  
    // Remove comment reference from card
    await Card.findByIdAndUpdate(comment.card, { $pull: { comments: comment._id } });
  
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
  
    // Log activity
    const card = await Card.findById(comment.card); // Retrieve the card for activity logging
    await Activity.create({
      board: card?.list, // Assuming card.list refers to the board
      card: comment.card,
      user: new mongoose.Types.ObjectId(user._id), // Ensure user ID is an ObjectId
      type: ActivityType.Deleted,
      details: `Deleted comment: "${comment.content}"`,
    });
  };

/**
 * Create a Reply to a Comment
 */
export const createReply = async (
  input: { cardId: string; parentCommentId: string; content: string },
  user: IUser
): Promise<IComment> => {
  const { cardId, parentCommentId, content } = input;

  const card = await Card.findById(cardId);
  if (!card) throw new Error('Card not found.');

  const parentComment = await Comment.findById(parentCommentId);
  if (!parentComment) throw new Error('Parent comment not found.');

  // Extract mentioned usernames using regex (assuming mentions are in the format @username)
  const mentionRegex = /@(\w+)/g;
  const mentionedUsernames: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentionedUsernames.push(match[1]);
  }

  // Fetch user IDs based on usernames
  const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } });
  const mentionedUserIds = mentionedUsers.map((user) => user._id.toString());

  const reply = new Comment({
    card: cardId,
    author: user._id.toString(),
    content,
    parentComment: parentCommentId,
    mentions: mentionedUserIds,
  });

  const savedReply = await reply.save();

  // Populate the author field
  await savedReply.populate('author');

  // Log activity
  await Activity.create({
    board: card.list,
    card: cardId,
    user: user._id.toString(),
    type: ActivityType.Replied,
    details: `Replied to comment: "${savedReply.content}"`,
  });

  // Notify mentioned users
  mentionedUserIds.forEach((userId) => {
    notifyUser(userId, `You were mentioned in a reply on card "${card.title}"`);
  });

  return savedReply;
};

/**
 * Toggle Like on a Comment
 */

export const toggleLikeComment = async (commentId: string, userId: string): Promise<IComment> => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new Error('Comment not found.');

  const userObjectId = new mongoose.Types.ObjectId(userId); // Ensure userId is treated as an ObjectId

  if (comment.likes.some((id) => id.equals(userObjectId))) {
    // Unlike
    comment.likes = comment.likes.filter((id) => !id.equals(userObjectId));
  } else {
    // Like
    comment.likes.push(userObjectId);
  }

  const updatedComment = await comment.save();

  // Populate the author field
  await updatedComment.populate('author');

  // Retrieve card details for logging
  const card = await Card.findById(comment.card);
  if (!card) throw new Error('Card not found for the comment.');

  // Log activity
  await Activity.create({
    board: card.list, // Assuming card.list refers to the board
    card: comment.card,
    user: userObjectId,
    type: ActivityType.LikedComment,
    details: comment.likes.some((id) => id.equals(userObjectId))
      ? 'Liked the comment.'
      : 'Unliked the comment.',
  });

  return updatedComment;
};

/**
 * Fetch all comments for a specific card
 */
export const fetchCommentsByCardId = async (cardId: string) => {
    try {
      const comments = await Comment.find({ card: cardId }).populate('author', 'name email');
      return comments;
    } catch (error) {
      console.error(`Error fetching comments for card ${cardId}:`, error);
      throw new Error('Failed to fetch comments');
    }
  };
  