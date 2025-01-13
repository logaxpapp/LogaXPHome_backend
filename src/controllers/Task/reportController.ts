// src/controllers/Task/reportController.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  generateAndSaveReport,
  fetchAllReports,
  fetchReportById,
  deleteReport
} from '../../services/Task/reportService';
import Report from '../../models/Task/Report';
import Board from '../../models/Task/Board';
import { IUser } from '../../models/User';
import { IReportFilters } from '../../types/report';


export const generateReportHandler = async (req: Request, res: Response) => {
  try {
    const filters: IReportFilters = req.body;
    const userId = req.user?._id; // from auth middleware

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const report = await generateAndSaveReport(
      filters,
      new mongoose.Types.ObjectId(userId)
    );

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
};

async function userCanAccessBoard(
  boardId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  const board = await Board.findById(boardId).select('owner members').lean();
  if (!board) return false;

  // if user is owner
  if (board.owner.toString() === userId) return true;

  // if user is in members
  if (board.members.map((m: any) => m.toString()).includes(userId)) return true;

  // or if user is admin
  if (userRole === 'admin') return true;

  return false;
}



export const fetchAllReportsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id; // from auth middleware
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // We'll assume you pass in ?boardId=xxx
    const boardId = req.query.boardId as string;
    if (!boardId) {
      res.status(400).json({ error: 'Missing boardId query param.' });
      return;
    }

    // Check is Admin
    const isAdmin = req.user?.role === 'admin';
    
   

  if ( !isAdmin) {
    throw new Error('Forbidden: not a member of this board');
  }


    // Check membership
    const canAccess = await userCanAccessBoard(boardId, userId.toString(), req.user?.role || 'admin');
    if (!canAccess) {
      res.status(403).json({ error: 'Forbidden: not a member of this board' });
      return;
    }

    // Then we fetch only the reports that match boardId
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    // We can store them in the same function or inline
    // Filter by { board: boardId }
    const [reports, total] = await Promise.all([
      Report.find({ board: boardId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('generatedBy', 'name email')
        .populate('board', 'name description')
        .lean(),
      Report.countDocuments({ board: boardId }),
    ]);

    res.json({
      reports,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchReportByIdHandler = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await fetchReportById(reportId);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteReportHandler = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const deleted = await deleteReport(reportId);
    if (!deleted) {
      res.status(404).json({ error: 'Report not found or already deleted' });
      return;
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: error.message });
  }
};
