// src/middlewares/refreshAccessTokenMiddleware.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import User from '../models/User';
import { refreshAccessToken } from '../services/googleService';

// Explicitly type the middleware as RequestHandler
export const checkGoogleAccessToken: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return; // Exit after sending response
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.googleAccessToken) {
      res.status(401).json({ message: 'Google account not linked' });
      return; // Exit after sending response
    }

    // Check if token is expired
    if (user.googleTokenExpiry && user.googleTokenExpiry < new Date()) {
      try {
        user.googleAccessToken = await refreshAccessToken(user._id.toString());
        await user.save(); // Save the updated access token
      } catch (error) {
        console.error('Error refreshing Google access token:', error);
        res.status(500).json({ message: 'Failed to refresh Google access token' });
        return; // Exit after sending response
      }
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error in checkGoogleAccessToken middleware:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
