// src/types/report.ts

export enum ReportType {
  TASKS_BY_STATUS = 'TASKS_BY_STATUS',
  TASKS_BY_USER = 'TASKS_BY_USER',
  TASKS_BY_PRIORITY = 'TASKS_BY_PRIORITY',
  TASKS_BY_BOARD = 'TASKS_BY_BOARD',
  TASKS_OVERDUE = 'TASKS_OVERDUE',
  TIME_IN_STATUS = 'TIME_IN_STATUS',
  AVERAGE_COMPLETION_TIME = 'AVERAGE_COMPLETION_TIME',
  BURNDOWN = 'BURNDOWN',
}

/**
 * Filters passed from front-end
 */
export interface IReportFilters {
  reportType: ReportType;
  boardId?: string;
  listId?: string;    // If you want to limit a single list
  userId?: string;    // If you want to limit to a single user
  status?: string;    // If you want to limit to certain statuses
  priority?: string;  // If you want to limit to certain priority
  startDate?: string; // For time-based reports
  endDate?: string;   // For time-based reports
  // Add other optional filters if needed
}

export interface IReportData {
  _id?: string;
  title?: string;
  generatedAt?: string | Date;
  data: any;
  reportType: ReportType;
  // Possibly other meta fields
}
