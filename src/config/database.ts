// src/config/database.ts
import mongoose from 'mongoose';
import logger from './logger';

export const connectDB = async () => {
  const MONGO_URI = process.env.DATABASE_URL as string;

  if (!MONGO_URI) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};
