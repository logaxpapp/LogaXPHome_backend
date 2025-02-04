// src/controllers/testCaseShareController.ts
import { Request, Response } from 'express';
import { createAndSendTestCaseShareToken } from '../services/shareTestCasesService';
import { UserRole } from '../types/enums';

export async function createTestCaseShareLinkController(req: Request, res: Response) {
  try {
    // Ensure the user is admin
    if (!req.user || req.user.role !== UserRole.Admin) {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    const { application, recipientEmail, daysValid } = req.body;
    if (!application || !recipientEmail) {
       res.status(400).json({
        message: 'application and recipientEmail are required',
      });
      return;
    }

    await createAndSendTestCaseShareToken({
      application,
      recipientEmail,
      createdBy: req.user,
      daysValid: daysValid || 7,
    });

     res.status(201).json({
      message: `Share link created & emailed to ${recipientEmail} for application ${application}`,
    });
    return;
  } catch (err: any) {
    console.error('Error creating testCase share link:', err);
     res.status(500).json({ message: 'Server error' });
     return;
  }
}
