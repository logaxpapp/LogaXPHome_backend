import { Request, Response } from 'express';
import {
  createArticle,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  listArticles,
  incrementArticleViews,
  likeArticle,
  addComment,
  getRelatedArticles,
  getTrendingArticles,
  getArticleById,
} from '../services/articleService';
import mongoose from 'mongoose';
import { IUser } from '../models/User';
import { createNotification } from '../services/notificationService';
import { io } from '../app';
import Article from '../models/Article';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const createArticleHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authorId = req.user?._id;
    if (!authorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const articleData = { ...req.body, author: authorId };
    const article = await createArticle(articleData);
    res.status(201).json({ data: article });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getArticleHandler = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    await incrementArticleViews(slug);
    const article = await getArticleBySlug(slug);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.status(200).json({ data: article });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const updateArticleHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const authorId = req.user?._id;

    const article = await updateArticle(id, req.body);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    // Check if the user is the author
    if (article.author.toString() !== authorId?.toString()) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ data: article });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const deleteArticleHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const authorId = req.user?._id;

    const article = await deleteArticle(id);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    // Check if the user is the author
    if (article.author.toString() !== authorId?.toString()) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

type ArticleStatus = 'Published' | 'Draft' | 'Archived';

export const listArticlesHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, tags, page, limit, status } = req.query;
  
      // Ensure authorId is a string or undefined
      const authorId =
        typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
  
      // Parse status into an array of ArticleStatus
      const statusArray: ArticleStatus[] | undefined = status
        ? (Array.isArray(status)
            ? (status as string[])
            : (status as string).split(',')
          ).filter((s): s is ArticleStatus => ['Published', 'Draft', 'Archived'].includes(s))
        : undefined;
  
      const isAdmin = req.user && req.user.role === 'admin';
  
      const articles = await listArticles({
        search: typeof search === 'string' ? search : undefined,
        tags:
          tags && typeof tags === 'string'
            ? tags.split(',')
            : Array.isArray(tags)
            ? (tags as string[])
            : undefined,
        status: statusArray,
        authorId: !isAdmin ? req.user?._id.toString() : authorId,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
      });
  
      res.status(200).json(articles);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || 'Internal Server Error' });
    }
  };

  export const getRelatedArticlesHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      const article = await Article.findById(id).exec();
  
      if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
      }
  
      const articleId = article._id.toString();
      const tags = article.tags;
  
      const relatedArticles = await getRelatedArticles(articleId, tags);
  
      res.status(200).json({ data: relatedArticles });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };

  export const getArticleByIdHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      // Optionally, validate that 'id' is a valid MongoDB ObjectId
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({ message: 'Invalid article ID' });
        return;
      }
  
      const article = await Article.findById(id)
        .populate('author', 'name email')
        .populate('comments.user', 'name email')
        .exec();
  
      if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
      }
  
      res.status(200).json({ data: article });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };

  export const getTrendingArticlesHandler = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await getTrendingArticles(limit);
      res.status(200).json({ data: articles });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };

export const updateArticleStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      const validStatuses = ['Published', 'Draft', 'Archived'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
      }
  
      const article = await updateArticle(id, { status });
  
      if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
      }
  
      res.status(200).json({ data: article });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };
  

  export const likeArticleHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id as mongoose.Types.ObjectId;
  
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      // Like the article
      await likeArticle(id, userId);
  
      // Fetch the article to get the author's ID
      const article = await getArticleById(id);
  
      if (article && article.author.toString() !== userId.toString()) {
        // Create and save the notification
        const notification = await createNotification({
          type: 'article_like',
          recipient: article.author as mongoose.Types.ObjectId,
          sender: userId,
          data: { articleId: id },
        });
        console.log('Notification saved:', notification);
        // Emit the saved notification object
        io.to(article.author.toString()).emit('notification', notification);
      }
  
      res.status(200).json({ message: 'Article liked' });
    } catch (error: any) {
      console.error('Error in likeArticleHandler:', error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };
    
  
  export const addCommentHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id as mongoose.Types.ObjectId;
      const { content } = req.body;
  
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      if (!content) {
        res.status(400).json({ message: 'Content is required' });
        return;
      }
  
      // Add the comment and get the updated article with author populated
      const article = await addComment(id, userId, content);
  
      if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
      }
  
      const authorId = (article.author as IUser)._id || article.author;
      const authorIdString = authorId.toString();
  
      // Create a notification for the article's author
      if (authorIdString !== userId.toString()) {
        const notification = await createNotification({
          type: 'article_comment',
          recipient: authorId as mongoose.Types.ObjectId,
          sender: userId,
          data: { articleId: id, comment: content },
        });
        console.log('Add comments Notification saved:', notification);
  
        // Emit the notification to the recipient
        io.to(authorIdString).emit('notification', notification);
      }
  
      res.status(200).json({ data: article });
    } catch (error: any) {
      console.error('Error in addCommentHandler:', error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };
  