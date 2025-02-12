// "I want the vital message at all time."
// src/models/TestCase.ts

import mongoose, { Schema, Document, Model, CallbackError } from 'mongoose';
import { IUser } from './User'; 

/** 
 * The recognized "applications" for test cases. 
 * Use "as const" so TypeScript treats them as literal types.
 */
export const APPLICATIONS = [
  'GatherPlux',
  'BookMiz',
  'BeautyHub',
  'TimeSync',
  'TaskBrick',
  'ProFixer',
  'DocSend',
  'LogaXP',
  'CashVent',
] as const; 

/** The possible priority levels for a test case. */
const PRIORITIES = ['Low', 'Medium', 'High'] as const;

/** The possible severity levels for a test case. */
const SEVERITIES = ['Minor', 'Major', 'Critical'] as const;

/** The recognized test types. Feel free to add more. */
const TEST_TYPES = ['Functional', 'Regression', 'Smoke', 'Performance', 'Security'] as const;

// Type definitions
export type ApplicationType = typeof APPLICATIONS[number]; 
export type PriorityType = typeof PRIORITIES[number];
export type SeverityType = typeof SEVERITIES[number];
export type TestType = typeof TEST_TYPES[number];

// Attachments
interface ITestAttachment {
  _id?: mongoose.Types.ObjectId;
  filename: string;
  url: string;
  uploadedAt: Date;
  fileType?: string; 
  contentType?: string;
}

// Steps
interface ITestStep {
  stepNumber: number;
  action: string;
  expected: string;
}

// Executions
interface ITestExecution {
  executionDate: Date;
  executedBy: mongoose.Types.ObjectId;
  actualResults: string;
  status: 'Pass' | 'Fail' | 'Blocked' | 'Retest';
  comments?: string;
  recommendations?: string;
  ticketId?: mongoose.Types.ObjectId; // linking to a Ticket if relevant
}

/**
 * A version history record for the test case.
 * Helps track changes over time (versioning).
 */
interface ITestCaseVersion {
  versionNumber: number;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
  changes: string; // Could be a summary or diff
}

// The main TestCase interface
export interface ITestCase extends Document {
  _id: mongoose.Types.ObjectId; 
  testId: string;
  feature: string;
  title: string;
  description?: string;
  preconditions?: string[];
  steps?: ITestStep[];
  expectedResults?: string;

  status?: 'Not Run' | 'In Progress' | 'Completed';
  comments?: string;

  application: ApplicationType;   
  environment: 'development' | 'staging' | 'production';

  /** Additional attachments (files, images, etc.) */
  attachments?: ITestAttachment[]; 

  /** The user assigned to this test (if any) */
  assignedTo?: mongoose.Types.ObjectId | IUser;

  /** The user who originally created this test case */
  createdBy: mongoose.Types.ObjectId | IUser;

  /** A record of test executions */
  executions: ITestExecution[];

  /** Additional fields to enhance your test case’s clarity & classification */
  priority?: PriorityType;
  severity?: SeverityType;
  testType?: TestType;
  tags?: string[];

  /** Link this test case to one or many requirements or user stories */
  requirementIds?: mongoose.Types.ObjectId[];

  /** Versioning array to track changes to the test case over time */
  versions?: ITestCaseVersion[];

  /** Indicate if test is automated and reference to script location */
  isAutomated?: boolean;
  automationScriptPath?: string;

  /** Estimated & last recorded execution time for scheduling or analytics */
  estimatedExecutionTime?: number; // e.g., in minutes
  lastExecutionTime?: number;      // e.g., in minutes

  createdAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

/** 
 * A simple schema for storing counters per-application. 
 * Used to generate unique testIds (e.g., "GatherPlux-TC-001").
 */
const TestIdGeneratorSchema = new Schema({
  _id: { type: String, required: true }, // e.g., "test_case_seq:GatherPlux"
  seq: { type: Number, default: 0 },
});
const TestIdGenerator = mongoose.model('TestIdGenerator', TestIdGeneratorSchema);

/** Child Schemas */
const TestStepSchema = new Schema<ITestStep>(
  {
    stepNumber: { type: Number, required: true },
    action: { type: String, required: true },
    expected: { type: String, default: '' },
  },
  { _id: false }
);

const TestExecutionSchema = new Schema<ITestExecution>(
  {
    executionDate: { type: Date, required: true, default: Date.now },
    executedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actualResults: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pass', 'Fail', 'Blocked', 'Retest'],
      required: true,
    },
    comments: { type: String },
    recommendations: { type: String },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
  },
  { _id: false }
);

const TestAttachmentSchema = new Schema<ITestAttachment>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    fileType: { type: String },
    contentType: { type: String },
  },
  { _id: false }
);

const TestCaseVersionSchema = new Schema<ITestCaseVersion>(
  {
    versionNumber: { type: Number, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedAt: { type: Date, required: true },
    changes: { type: String, required: true },
  },
  { _id: false }
);

/**
 * The primary TestCase schema.
 * 
 * Contains references to all sub-schemas and additional 
 * classification fields (priority, severity, testType, tags, etc.).
 */
const TestCaseSchema = new Schema<ITestCase>(
  {
    testId: { type: String, required: true, unique: true },
    feature: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    preconditions: [{ type: String }],
    steps: [TestStepSchema],
    expectedResults: { type: String },
    status: {
      type: String,
      enum: ['Not Run', 'In Progress', 'Completed'],
      default: 'Not Run',
    },
    comments: { type: String },
    attachments: [TestAttachmentSchema],

    // Application environment data
    application: {
      type: String,
      required: true,
      enum: APPLICATIONS,
      index: true,
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
    },

    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    executions: [TestExecutionSchema],

    // Additional classification fields
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'Medium',
    },
    severity: {
      type: String,
      enum: SEVERITIES,
      default: 'Minor',
    },
    testType: {
      type: String,
      enum: TEST_TYPES,
      default: 'Functional',
    },
    tags: [{ type: String }],

    // Linking test cases to requirements or user stories
    requirementIds: [{ type: Schema.Types.ObjectId, ref: 'Requirement' }],

    // Version history for this test case
    versions: [TestCaseVersionSchema],

    // Automation-related fields
    isAutomated: { type: Boolean, default: false },
    automationScriptPath: { type: String },
    estimatedExecutionTime: { type: Number }, // e.g. in minutes
    lastExecutionTime: { type: Number },

  },
  { timestamps: true }
);

/**
 * Pre-validation hook to auto-generate a testId 
 * (e.g., "GatherPlux-TC-001") if not already set.
 */
TestCaseSchema.pre('validate', async function (next: (err?: CallbackError) => void) {
  const doc = this as ITestCase;

  // Only generate if doc.testId is missing => new doc
  if (!doc.testId) {
    try {
      const safeApp = doc.application.replace(/\s+/g, '');
      const counterId = `test_case_seq:${safeApp}`;

      const counter = await TestIdGenerator.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      ).exec();

      if (!counter) {
        return next(new Error('Failed to generate testId sequence.'));
      }

      // final testId => "GatherPlux-TC-001", etc.
      doc.testId = `${safeApp}-TC-${counter.seq.toString().padStart(3, '0')}`;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return next(error);
      }
      return next(new Error('Unknown error while generating testId.'));
    }
  }
  next();
});

const TestCase: Model<ITestCase> = mongoose.model<ITestCase>('TestCase', TestCaseSchema);
export default TestCase;
