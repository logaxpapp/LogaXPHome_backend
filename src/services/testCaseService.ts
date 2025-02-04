// "I want the vital message at all time."
// src/services/testCaseService.ts

import mongoose, { UpdateQuery } from 'mongoose';
import TestCase, { ITestCase } from '../models/TestCase';
import User from '../models/User';
import ticketService from './ticketService';
import { ITicket, TicketPriority, TicketCategory, TicketStatus } from '../models/Ticket';
import { IUser } from '../models/User';

/**
 * Type used for partial updates (e.g., $set, $pull, etc.) on a TestCase.
 */
type TestCaseUpdate = Partial<ITestCase> | UpdateQuery<ITestCase>;

/**
 * Create a new test case.
 * - If `testId` is omitted, it's auto-generated by the Mongoose pre-validate hook.
 * - This can include new fields like priority, severity, testType, tags, etc.
 */
export async function createTestCase(data: Partial<ITestCase>): Promise<ITestCase> {
  // The data can contain:
  //   feature, title, createdBy, application, environment, priority, severity, testType, tags, etc.
  const testCase = new TestCase(data);
  await testCase.save();
  return testCase;
}

/**
 * Options for retrieving multiple test cases with filtering, pagination, sorting, etc.
 */
export interface GetAllTestCasesOptions {
  application?: string;
  environment?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Retrieve test cases with flexible filters, search, pagination, and sorting.
 */
export async function getAllTestCases(
  options: GetAllTestCasesOptions = {}
): Promise<{ testCases: ITestCase[]; total: number }> {
  const query: any = {};

  // 1) Build filters
  if (options.application) {
    query.application = options.application;
  }
  if (options.environment) {
    query.environment = options.environment;
  }
  if (options.status) {
    query.status = options.status;
  }
  if (options.search) {
    // Simple search on title & description
    query.$or = [
      { title:       { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } },
    ];
  }

  // 2) Pagination
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // 3) Sorting
  const sortField = options.sortField || 'testId';
  const order: 'asc' | 'desc' = options.sortOrder === 'desc' ? 'desc' : 'asc';
  const sortObj: Record<string, 'asc' | 'desc'> = { [sortField]: order };

  // 4) Query & Count
  const [testCases, total] = await Promise.all([
    TestCase.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('requirementIds', 'title description status priority application')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .exec(),
    TestCase.countDocuments(query),
  ]);

  return { testCases, total };
}

/**
 * Update a TestCase by ID with partial data.
 * - This may include updating newly added fields (priority, severity, tags, etc.).
 */
export async function updateTestCase(
    id: string,
    data: Partial<ITestCase>,
    userId?: string // pass in from your controller if needed
  ): Promise<ITestCase | null> {
    // 1) Fetch existing testCase
    const existing = await TestCase.findById(id);
    if (!existing) return null;
  
    // 2) Build a summary of changes
    let changesDesc = 'Fields updated: ';
    if (data.title && data.title !== existing.title) {
      changesDesc += `Title from "${existing.title}" to "${data.title}". `;
    }
    if (data.priority && data.priority !== existing.priority) {
      changesDesc += `Priority from "${existing.priority}" to "${data.priority}". `;
    }
    // ... etc.
  
    // 3) Decide on versionNumber
    const lastVersionNumber =
      existing.versions && existing.versions.length > 0
        ? existing.versions[existing.versions.length - 1].versionNumber
        : 0;
    const newVersionNumber = lastVersionNumber + 1;
  
    // 4) Build version record only if we have a valid user
    let newVersion;
    if (userId && userId.length === 24) {
      newVersion = {
        versionNumber: newVersionNumber,
        updatedBy: new mongoose.Types.ObjectId(userId), // <-- valid hex string
        updatedAt: new Date(),
        changes: changesDesc,
      };
    }
  
    // 5) Apply the data to `existing`
    existing.set(data);
  
    // 6) Append new version if we built one
    if (newVersion) {
      existing.versions = existing.versions ?? [];
      existing.versions.push(newVersion);
    }
  
    // 7) Save
    await existing.save();
  
    // 8) Return the updated doc
    return TestCase.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('versions.updatedBy', 'name email')
      .populate('executions.executedBy', 'name email')
      .populate('requirementIds', 'title description status priority application')
      .exec();
  }
/**
 * Retrieve a single TestCase by ID.
 */
export async function getTestCaseById(id: string): Promise<ITestCase | null> {
  return TestCase.findById(id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('executions.executedBy', 'name email')
    .populate('requirementIds', 'title description status priority application')
    .exec();
}

/**
 * Delete a TestCase by ID.
 * Returns `true` if deletion is successful, otherwise `false`.
 */
export async function deleteTestCase(id: string): Promise<boolean> {
  try {
    const result = await TestCase.findByIdAndDelete(id).exec();
    return !!result; // `true` if deleted, `false` if not found
  } catch (error) {
    console.error('Error deleting test case:', error);
    return false;
  }
}

/**
 * Assign a TestCase to a particular user (sets assignedTo = userId).
 */
export async function assignTestCase(
  id: string,
  userId: mongoose.Types.ObjectId
): Promise<ITestCase | null> {
  const updated = await TestCase.findByIdAndUpdate(
    id,
    { assignedTo: userId },
    { new: true }
  )
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('executions.executedBy', 'name email')
    .exec();

  return updated;
}

export interface IAddExecutionPayload {
  executedBy: string;  // user ObjectId in string form
  actualResults: string;
  status: 'Pass' | 'Fail' | 'Blocked' | 'Retest';
  comments?: string;
  recommendations?: string;
}

/**
 * Add a new test execution record to a given TestCase.
 * - If status = "Fail", auto-creates a new ticket.
 */
export async function addTestExecution(
  testCaseId: string,
  executionData: IAddExecutionPayload
): Promise<ITestCase | null> {
  // 1) Find the testCase
  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) return null;

  // 2) Validate user ID
  if (!executionData.executedBy || executionData.executedBy.length < 24) {
    throw new Error('Invalid executedBy user ID');
  }

  // 3) Construct new execution
  const newExecution = {
    executionDate: new Date(),
    executedBy: new mongoose.Types.ObjectId(executionData.executedBy),
    actualResults: executionData.actualResults,
    status: executionData.status,
    comments: executionData.comments,
    recommendations: executionData.recommendations,
    ticketId: undefined as mongoose.Types.ObjectId | undefined,
  };

  testCase.executions.push(newExecution);

  // 4) If "Fail", optionally create a Ticket
  if (newExecution.status === 'Fail') {
    const userDoc = await User.findById(executionData.executedBy);

    // Build partial ticket data
    const ticketData: Partial<ITicket> = {
      title: `TestCase Fail: ${testCase.title}`,
      description: `TestCase [${testCase.testId}] in "${testCase.application}" has failed.\nActual results: ${newExecution.actualResults}`,
      priority: TicketPriority.High,
      category: TicketCategory.BugReport,
      application: testCase.application,
      department: 'IT',
      status: TicketStatus.Open,
      createdBy: testCase.createdBy,
    };

    // Create Ticket
    const newTicket = await ticketService.createTicket(ticketData, userDoc || undefined);
    if (newTicket && newTicket._id) {
      newExecution.ticketId = newTicket._id;
    }
  }

  // 5) Save TestCase
  await testCase.save();

  // 6) Return populated version
  return TestCase.findById(testCaseId)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('executions.executedBy', 'name email')
    .populate('executions.ticketId', '_id title status')
    .exec();
}
