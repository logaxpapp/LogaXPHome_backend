// "I want the vital message at all time."
// src/routes/testCaseRoutes.ts

import express from 'express';
import {
  createTestCaseController,
  getAllTestCasesController,
  getTestCaseController,
  updateTestCaseController,
  deleteTestCaseController,
  assignTestCaseController,
  addTestExecutionController,
  getApplicationsController,
  addTestCaseAttachmentController,
  deleteTestCaseAttachmentController,
  getTestAnalysis,
  getPersonalTestCasesController,
  linkRequirementController,
  unlinkRequirementController,
} from '../controllers/testCaseController';

import { authenticateJWT } from '../middlewares/authMiddleware';
import upload from '../utils/multerConfigs';

const router = express.Router();

// Ensure all routes here require JWT authentication
router.use(authenticateJWT);

router.get('/analysis', getTestAnalysis);

/**
 * @route   GET /test-cases/applications
 * @desc    Retrieve distinct application names from all test cases.
 * @access  Protected
 */
router.get('/applications', getApplicationsController);

/** 
 * GET /test-cases/personal
 * e.g., /test-cases/personal?assignedTo=someUserId&search=Regression
 */
router.get('/personal', getPersonalTestCasesController);

/**
 * @route   GET /test-cases
 * @desc    Retrieve all test cases with optional filters (application, environment, status, search).
 * @access  Protected
 */
router.get('/', getAllTestCasesController);

/**
 * @route   GET /test-cases/:id
 * @desc    Retrieve a single test case by its Mongo _id.
 * @access  Protected
 */
router.get('/:id', getTestCaseController);

/**
 * @route   POST /test-cases
 * @desc    Create a new test case.
 * @access  Protected
 */
router.post('/', createTestCaseController);

/**
 * @route   PUT /test-cases/:id
 * @desc    Update an existing test case (including new fields like priority, severity, etc.).
 * @access  Protected
 */
router.put('/:id', updateTestCaseController);

/**
 * @route   DELETE /test-cases/:id
 * @desc    Delete a test case (only Admin or creator).
 * @access  Protected
 */
router.delete('/:id', deleteTestCaseController);

/**
 * @route   POST /test-cases/:id/assign
 * @desc    Assign a test case to a user (sets assignedTo).
 * @access  Protected
 */
router.post('/:id/assign', assignTestCaseController);

/**
 * @route   POST /test-cases/:id/executions
 * @desc    Add a test execution record (if Fail => auto-create ticket).
 * @access  Protected
 */
router.post('/:id/executions', addTestExecutionController);

/**
 * @route   POST /test-cases/:id/attachments
 * @desc    Upload a single file (multer) and attach to the test case.
 * @access  Protected
 */
router.post('/:id/attachments', upload.single('attachment'), addTestCaseAttachmentController);

/**
 * @route   DELETE /test-cases/:id/attachments/:attachmentId
 * @desc    Remove an attachment from a test case by attachment _id.
 * @access  Protected
 */
router.delete('/:id/attachments/:attachmentId', deleteTestCaseAttachmentController);

/** Requirement linking/unlinking */
router.post('/:id/link-requirement', linkRequirementController);
router.post('/:id/unlink-requirement', unlinkRequirementController);


export default router;
