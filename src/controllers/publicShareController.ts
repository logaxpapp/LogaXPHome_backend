// src/controllers/publicShareController.ts
import { Request, Response } from 'express';
import ShareToken from '../models/ShareToken';
import { getAllTestCases } from '../services/testCaseService'; // or wherever you have your function

export async function getPublicApplicationTestCases(req: Request, res: Response) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Token is required' });
    }

    // 1) Look up share token in DB
    const shareToken = await ShareToken.findOne({ token }).exec();
    if (!shareToken) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    // Optional: if shareToken.expiresAt < new Date(), it's expired

    // 2) Query test cases for that application
    const { testCases } = await getAllTestCases({
      application: shareToken.application,
      limit: 9999, 
      // or no limit, depends on your preference
    });

    // 3) Return them
    return res.json({
      application: shareToken.application,
      testCases,
    });
  } catch (err: any) {
    console.error('Error in getPublicApplicationTestCases:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
