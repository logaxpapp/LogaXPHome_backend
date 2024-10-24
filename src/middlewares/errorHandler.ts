// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
};
