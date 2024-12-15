// articleRoutes.ts

import express from 'express';
import {
  createArticleHandler,
  getArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
  listArticlesHandler,
  likeArticleHandler,
  addCommentHandler,
  updateArticleStatusHandler,
  getRelatedArticlesHandler,
  getTrendingArticlesHandler,
  getArticleByIdHandler,
} from '../controllers/articleController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

// Admin Routes (Protected)
router.get('/admin', authenticateJWT, authorizeRoles(UserRole.Admin), listArticlesHandler);

router.get('/id/:id', authenticateJWT, getArticleByIdHandler);

// Public Routes
router.get('/', listArticlesHandler);
router.get('/trending', getTrendingArticlesHandler);
router.get('/:slug', getArticleHandler);
router.get('/:id/related', getRelatedArticlesHandler);

// Protected Routes
router.post('/', authenticateJWT, createArticleHandler);
router.put('/:id', authenticateJWT, updateArticleHandler);
router.delete('/:id', authenticateJWT, deleteArticleHandler);
router.post('/:id/like', authenticateJWT, likeArticleHandler);
router.post('/:id/comments', authenticateJWT, addCommentHandler);
router.put('/:id/status', authenticateJWT, authorizeRoles(UserRole.Admin), updateArticleStatusHandler);


export default router;

