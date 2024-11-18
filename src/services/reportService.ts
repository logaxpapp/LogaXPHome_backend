// src/services/reportService.ts

import ApprovalRequestBase from '../models/ApprovalRequest';
import mongoose from 'mongoose';

/**
 * Get report of approval requests by status
 */
export const getApprovalStatusReportService = async () => {
  return await ApprovalRequestBase.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
      },
    },
  ]);
};

/**
 * Get average performance ratings per period
 */
export const getAveragePerformanceRatingService = async () => {
  return await ApprovalRequestBase.aggregate([
    {
      $match: { status: 'Approved', performanceRating: { $exists: true } },
    },
    {
      $group: {
        _id: '$request_data.period',
        averageRating: { $avg: '$performanceRating' },
        total: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'appraisalperiods',
        localField: '_id',
        foreignField: '_id',
        as: 'period',
      },
    },
    {
      $unwind: '$period',
    },
    {
      $project: {
        _id: 0,
        periodName: '$period.name',
        averageRating: { $round: ['$averageRating', 2] },
        totalRequests: '$total',
      },
    },
  ]);
};
