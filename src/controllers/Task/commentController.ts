// src/controllers/Task/commentController.ts

import { Request, Response, NextFunction } from 'express';
import {
  createComment,
  deleteComment,
  editComment,
  createReply,
  toggleLikeComment,
  fetchCommentsByCardId,
} from '../../services/Task/commentService';
import { IUser } from '../../models/User';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Create a new Comment
 */
export const createCommentHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cardId, content, parentCommentId } = req.body;
    const author = req.user!;

    if (!cardId || !content) {
      res.status(400).json({ message: 'cardId and content are required.' });
      return;
    }

    const comment = await createComment(
      { cardId, content, parentCommentId },
      author
    );
    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Edit a Comment
 */
export const editCommentHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !content) {
      res.status(400).json({ message: 'commentId and content are required.' });
      return;
    }

    const updatedComment = await editComment(commentId, { content }, req.user!);
    res.status(200).json(updatedComment);
  } catch (error: any) {
    console.error('Error editing comment:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Delete a Comment
 */
export const deleteCommentHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;
    if (!commentId) {
      res.status(400).json({ message: 'commentId is required.' });
      return;
    }
    await deleteComment(commentId, req.user!);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Create a Reply to a Comment
 */
export const createReplyHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { parentCommentId } = req.params;
    const { cardId, content } = req.body;

    if (!parentCommentId || !cardId || !content) {
      res.status(400).json({ message: 'parentCommentId, cardId, and content are required.' });
      return;
    }

    const reply = await createReply({ cardId, parentCommentId, content }, req.user!);
    res.status(201).json(reply);
  } catch (error: any) {
    console.error('Error creating reply:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Toggle Like on a Comment
 */
export const toggleLikeCommentHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commentId } = req.params;
    if (!commentId) {
      res.status(400).json({ message: 'commentId is required.' });
      return;
    }

    const userId = req.user!._id.toString();
    const updatedComment = await toggleLikeComment(commentId, userId);
    res.status(200).json(updatedComment);
  } catch (error: any) {
    console.error('Error toggling like on comment:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};


/**
 * Fetch Comments by Card ID
 */
export const fetchCommentsHandler = async (req: Request, res: Response) => {
 try {
   const { cardId } = req.params;
   const comments = await fetchCommentsByCardId(cardId);
    res.status(200).json(comments);
    return
 } catch (error: any) {
   console.error('Error fetching comments:', error.message);
   res.status(500).json({ message: error.message });
   return 
 }
};