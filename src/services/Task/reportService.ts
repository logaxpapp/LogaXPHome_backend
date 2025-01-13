// src/services/Task/reportService.ts

import mongoose from 'mongoose';
import Report, { IReport } from '../../models/Task/Report';
import Card from '../../models/Task/Card';
import List from '../../models/Task/List';
import Board from '../../models/Task/Board';
import { IUser } from '../../models/User'; // If you have a user model
import { IReportFilters, ReportType } from '../../types/report';

/**
 * Helper: get list IDs for a board
 */
const getListIds = async (boardId?: string): Promise<mongoose.Types.ObjectId[]> => {
  if (!boardId) return [];

  // Specify the return type using generics
  const lists = await List.find<{ _id: mongoose.Types.ObjectId }>({ board: boardId })
    .select('_id')
    .exec();

  return lists.map((list) => list._id);
};


/**
 * Helper: for date range-based queries
 */
const getDateRangeFilter = (startDate?: string, endDate?: string) => {
  const filter: any = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return Object.keys(filter).length ? filter : undefined;
};

/**
 * Generate & save a "Jira-like" advanced report
 */
export const generateAndSaveReport = async (
  filters: IReportFilters,
  generatedBy: mongoose.Types.ObjectId | IUser
): Promise<IReport> => {
  const { reportType, boardId, startDate, endDate } = filters;

  let title = '';
  let data: any = {};

  switch (reportType) {
    /**
     * 1) TASKS_BY_STATUS
     */
    case ReportType.TASKS_BY_STATUS:
      title = 'Tasks by Status';
      data = await Card.aggregate([
        { $match: { list: { $in: await getListIds(boardId) } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            tasks: {
              $push: {
                id: '$_id',
                title: '$title',
                status: '$status',
                assignees: '$assignees',
                dueDate: '$dueDate',
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);
      break;

    /**
     * 2) TASKS_BY_USER
     */
    case ReportType.TASKS_BY_USER:
      title = 'Tasks by User';
      data = await Card.aggregate([
        { $match: { list: { $in: await getListIds(boardId) } } },
        { $unwind: '$assignees' },
        {
          $group: {
            _id: '$assignees',
            count: { $sum: 1 },
            tasks: {
              $push: {
                id: '$_id',
                title: '$title',
                status: '$status',
                priority: '$priority',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            user: '$user.name',
            email: '$user.email',
            count: 1,
            tasks: 1,
          },
        },
        { $sort: { count: -1 } },
      ]);
      break;

    /**
     * 3) TASKS_BY_PRIORITY
     */
    case ReportType.TASKS_BY_PRIORITY:
      title = 'Tasks by Priority';
      data = await Card.aggregate([
        { $match: { list: { $in: await getListIds(boardId) } } },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
            tasks: {
              $push: {
                id: '$_id',
                title: '$title',
                priority: '$priority',
                status: '$status',
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);
      break;

    /**
     * 4) TASKS_BY_BOARD
     */
    case ReportType.TASKS_BY_BOARD:
      title = 'Tasks by Board';
      data = await Board.aggregate([
        {
          $lookup: {
            from: 'lists',
            localField: '_id',
            foreignField: 'board',
            as: 'lists',
          },
        },
        { $unwind: '$lists' },
        {
          $lookup: {
            from: 'cards',
            localField: 'lists._id',
            foreignField: 'list',
            as: 'tasks',
          },
        },
        {
          $group: {
            _id: '$name',
            totalTasks: { $sum: { $size: '$tasks' } },
            tasks: { $push: { list: '$lists.name', tasks: '$tasks' } },
          },
        },
        { $sort: { totalTasks: -1 } },
      ]);
      break;

    /**
     * 5) TASKS_OVERDUE
     */
    case ReportType.TASKS_OVERDUE:
      title = 'Overdue Tasks';
      data = await Card.find({
        list: { $in: await getListIds(boardId) },
        dueDate: { $lt: new Date() },
        status: { $ne: 'Done' },
      })
        .populate('assignees', 'name email')
        .populate('list', 'name')
        .exec();
      break;

    /**
     * 6) TIME_IN_STATUS
     * Requires Card.statusHistory array with { status, from, to }.
     */
    case ReportType.TIME_IN_STATUS:
      title = 'Time in Status';
      data = await Card.aggregate([
        {
          $match: {
            list: { $in: await getListIds(boardId) },
            ...(startDate || endDate
              ? { createdAt: { ...getDateRangeFilter(startDate, endDate) } }
              : {}),
          },
        },
        { $unwind: '$statusHistory' },
        {
          $group: {
            _id: {
              status: '$statusHistory.status',
              cardId: '$_id',
            },
            totalTime: {
              $sum: {
                $subtract: [
                  '$statusHistory.to',
                  '$statusHistory.from',
                ],
              },
            },
            cardTitle: { $first: '$title' },
          },
        },
        {
          $group: {
            _id: '$_id.status',
            totalTimeInMs: { $sum: '$totalTime' },
            cards: { $push: { cardId: '$_id.cardId', cardTitle: '$cardTitle' } },
          },
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            totalTimeInMs: 1,
            totalTimeInHours: { $divide: ['$totalTimeInMs', 3600000] },
            cards: 1,
          },
        },
        { $sort: { totalTimeInMs: -1 } },
      ]);
      break;

    /**
     * 7) AVERAGE_COMPLETION_TIME
     * Requires a Card.completedAt to measure time from createdAt -> completedAt
     */
    case ReportType.AVERAGE_COMPLETION_TIME:
      title = 'Average Completion Time';
      data = await Card.aggregate([
        {
          $match: {
            list: { $in: await getListIds(boardId) },
            status: 'Done',
            completedAt: { $exists: true },
            ...(startDate || endDate
              ? { createdAt: { ...getDateRangeFilter(startDate, endDate) } }
              : {}),
          },
        },
        {
          $project: {
            title: 1,
            createdAt: 1,
            completedAt: 1,
            timeToComplete: { $subtract: ['$completedAt', '$createdAt'] },
          },
        },
        {
          $group: {
            _id: null,
            averageTimeMs: { $avg: '$timeToComplete' },
            totalCompleted: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            averageTimeMs: 1,
            totalCompleted: 1,
            averageTimeHours: { $divide: ['$averageTimeMs', 3600000] },
          },
        },
      ]);
      break;

    /**
     * 8) BURNDOWN
     * For a simplistic approach, bucket tasks by creation date. 
     * In real scenarios, you'd do more advanced day-by-day or sprint-based queries.
     */
    case ReportType.BURNDOWN:
      title = 'Burndown Data';
      data = await Card.aggregate([
        {
          $match: {
            list: { $in: await getListIds(boardId) },
            ...(startDate || endDate
              ? { createdAt: { ...getDateRangeFilter(startDate, endDate) } }
              : {}),
          },
        },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            },
            count: { $sum: 1 },
            tasks: { $push: '$$ROOT' },
          },
        },
        { $sort: { '_id.day': 1 } },
      ]);
      break;

    default:
      throw new Error(`Invalid or unsupported Report Type: ${reportType}`);
  }

  // Create & save
  const report = new Report({
    reportType,
    filters,
    generatedBy,
    data,
    title,
    board: boardId,
  });

  return await report.save();
};

/**
 * Fetch all saved reports (optionally with pagination, etc.)
 */
export const fetchAllReports = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [reports, total] = await Promise.all([
    Report.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('generatedBy', 'name email')
      .lean(),
    Report.countDocuments({}),
  ]);

  return {
    reports,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Fetch single report by ID
 */
export const fetchReportById = async (reportId: string) => {
  return Report.findById(reportId).populate('generatedBy', 'name email').lean();
};

/**
 * Delete a report by ID
 */
export const deleteReport = async (reportId: string) => {
  return Report.findByIdAndDelete(reportId);
};
