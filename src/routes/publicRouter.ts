// src/routes/publicRoutes.ts

import express from 'express';
import ShareToken from '../models/ShareToken';
import { getAllTestCases } from '../services/testCaseService';

const publicRouter = express.Router();

publicRouter.get('/testcases-share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
       res.status(400).json({ message: 'No token provided' });
       return;
    }

    const shareToken = await ShareToken.findOne({ token }).exec();
    if (!shareToken) {
       res.status(404).json({ message: 'Invalid or expired token' });
         return;
    }

    // Check expiration
    if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
       res.status(400).json({ message: 'Share link has expired' });
       return;
    }

    // Use your getAllTestCases method, filtering by application
    const { testCases, total } = await getAllTestCases({
      application: shareToken.application,
      limit: 9999, // or no limit
    });

     res.json({
      application: shareToken.application,
      testCases,
      total,
    });
    return;
  } catch (err: any) {
    console.error('Error fetching shared testcases:', err);
     res.status(500).json({ message: 'Server error' });
    return;
  }
});

export default publicRouter;
