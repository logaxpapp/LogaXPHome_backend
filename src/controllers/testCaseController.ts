// src/controllers/testCaseController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TestCase from '../models/TestCase';
import Requirement from '../models/Requirement';
import {IUser} from '../models/User';
import {
  createTestCase,
  getAllTestCases,
  getTestCaseById,
  updateTestCase,
  deleteTestCase,
  assignTestCase,
  addTestExecution,
  IAddExecutionPayload,
  GetAllTestCasesOptions,
  getPersonalTestCases,
  GetPersonalTestCasesOptions
} from '../services/testCaseService';
import { UserRole } from '../types/enums';
import { sendEmail } from '../utils/email'; // <-- import your email utility

/**
 * A simple type guard to check if the field is a populated IUser 
 * rather than just an ObjectId. If .email exists, we consider it a user doc.
 */
function isPopulatedUser(
  doc: mongoose.Types.ObjectId | IUser
): doc is IUser {
  return (doc as IUser).email !== undefined;
}

/**
 * Notify watchers of changes to a TestCase.
 * Includes a styled HTML email with LogaXP header & contact info.
 */
export async function notifyTestCaseChange(
  testCaseId: string,
  action: string,
  extraInfo?: string
) {
  try {
    // 1) Fetch the TestCase with createdBy and assignedTo populated
    const testCase = await TestCase.findById(testCaseId)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .exec();

    if (!testCase) return; // If not found, just exit

    // 2) Collect potential recipients in a Set (avoid duplicates)
    const recipients = new Set<string>();

    if (testCase.createdBy && isPopulatedUser(testCase.createdBy)) {
      recipients.add(testCase.createdBy.email);
    }
    if (testCase.assignedTo && isPopulatedUser(testCase.assignedTo)) {
      recipients.add(testCase.assignedTo.email);
    }

    if (recipients.size === 0) {
      // No one to notify
      return;
    }

    // 3) Build the subject
    const subject = `Test Case "${testCase.title}" (${testCase.testId}) ${action}`;

    // 4) Build a plain-text body
    const textBody = `Hello,

The following test case has just been ${action}:

  Title: ${testCase.title}
  Application: ${testCase.application}
  Test ID: ${testCase.testId}

Additional info:
  ${extraInfo || 'No extra details'}

Regards,
LogaXP QA System
Enquire: +1 6155543592
`;

    // 5) Build a more refined HTML body
    //    We add some styling, a header with LogaXP name & contact, etc.
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <!-- Header / Banner -->
        <div style="
          background-color: #333; 
          color: #fff;
          padding: 15px 20px;
          border-radius: 5px;
          text-align: center;
        ">
          <h1 style="margin: 0; font-size: 24px;">LogaXP</h1>
          <p style="margin: 0; font-size: 14px;">Enquire: +1 6155543592</p>
        </div>

        <!-- Main Content Panel -->
        <div style="
          background-color: #fff; 
          margin-top: 20px; 
          padding: 20px; 
          border-radius: 5px; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        ">
          <h2 style="color: #333; margin-top: 0;">
            Test Case "${testCase.title}" (${testCase.testId}) <em>${action}</em>
          </h2>
          
          <ul style="list-style: none; padding-left: 0;">
            <li><strong>Application:</strong> ${testCase.application}</li>
            <li><strong>Title:</strong> ${testCase.title}</li>
            <li><strong>Test ID:</strong> ${testCase.testId}</li>
          </ul>
          
          <p style="margin-top: 1em;">
            <strong>Additional Info:</strong><br/>
            ${extraInfo || 'No extra details'}
          </p>

          <hr style="margin: 1em 0;" />

          <p style="margin-bottom: 0;">
            Regards,<br/>
            <strong>LogaXP QA System</strong>
          </p>
        </div>
      </div>
    `;

    // 6) Send the email to all relevant recipients
    //    Convert recipients to a comma-separated string if needed
    await sendEmail({
      to: Array.from(recipients).join(','), 
      subject,
      text: textBody,
      html: htmlBody,
    });

  } catch (error) {
    console.error('Error sending test case change notification:', error);
  }
}

/**
 * CREATE Test Case
 */
export async function createTestCaseController(req: Request, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required or not found in request' });
      return;
    }

    const data = {
      ...req.body,
      createdBy: userId,
    };

    const newCase = await createTestCase(data);
    res.status(201).json(newCase);

    // Notify watchers (creator, assigned user if any) about creation
    await notifyTestCaseChange(newCase._id.toString(), 'created');

  } catch (err: any) {
    console.error('Error creating test case:', err);
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET All Test Cases
 */
export async function getAllTestCasesController(req: Request, res: Response) {
  try {
    const {
      application,
      environment,
      status,
      search,
      page,
      limit,
      sortField,
      sortOrder,
    } = req.query;

    const options: GetAllTestCasesOptions = {
      application: application ? String(application) : undefined,
      environment: environment ? String(environment) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortField: sortField ? String(sortField) : 'testId',
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
    };

    const result = await getAllTestCases(options);
    res.status(200).json(result);

    // Note: Typically we do NOT send emails for just listing queries (no data changed).
    // So no notification here.

  } catch (err) {
    console.error('Error fetching test cases:', err);
    res.status(400).json({ message: 'Error fetching test cases' });
  }
}

/**
 * GET Single Test Case by ID
 */
export async function getTestCaseController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const testCase = await getTestCaseById(id);
    if (!testCase) {
      res.status(404).json({ message: 'TestCase not found' });
      return;
    }
    res.status(200).json(testCase);

    // No changes to data => no email

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * UPDATE Test Case
 */
export async function updateTestCaseController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?._id ? req.user._id.toString() : undefined;

    const updated = await updateTestCase(id, data, userId);
    if (!updated) {
      res.status(404).json({ message: 'TestCase not found or not updated' });
      return;
    }
    res.status(200).json(updated);

    // Notify watchers of the update
    await notifyTestCaseChange(id, 'updated', `Changed fields: ${Object.keys(data).join(', ')}`);

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * DELETE Test Case
 */
export async function deleteTestCaseController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid Test Case ID format' });
      return;
    }

    const testCase = await TestCase.findById(id);
    if (!testCase) {
      res.status(404).json({ message: 'TestCase not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: No user logged in' });
      return;
    }

    const isAdmin = req.user.role === UserRole.Admin;
    const isCreator =
      req.user._id.toString() === testCase.createdBy.toString();

    if (!isAdmin && !isCreator) {
      res.status(403).json({
        message: 'You must be an Admin or the creator to delete this test case',
      });
      return;
    }

    const success = await deleteTestCase(id);
    if (!success) {
      res.status(500).json({
        message: 'Failed to delete test case. Please try again.',
      });
      return;
    }

    res.status(200).json({ message: 'Test Case deleted successfully' });

    // Notify watchers the test case is gone
    await notifyTestCaseChange(id, 'deleted');

  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
      return;
    }
    res.status(500).json({
      message: 'An unknown error occurred while deleting the test case',
    });
  }
}

/**
 * ASSIGN Test Case
 */
export async function assignTestCaseController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: 'Missing userId' });
      return;
    }
    const objectId = new mongoose.Types.ObjectId(userId);

    const updated = await assignTestCase(id, objectId);
    if (!updated) {
      res.status(404).json({ message: 'TestCase not found or not updated' });
      return;
    }
    res.status(200).json(updated);

    // Notify watchers of assignment
    await notifyTestCaseChange(id, 'assigned', `Assigned to userId = ${userId}`);

  } catch (err: any) {
    console.error('Error assigning test case:', err);
    res.status(400).json({ message: err.message });
  }
}

/**
 * ADD Test Execution
 */
export async function addTestExecutionController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const execData = req.body as IAddExecutionPayload;

    if (!execData.executedBy || !execData.actualResults || !execData.status) {
      res.status(400).json({
        message:
          'executedBy, actualResults, and status are required fields for test execution',
      });
      return;
    }

    const updatedCase = await addTestExecution(id, execData);
    if (!updatedCase) {
      res.status(404).json({
        message: 'TestCase not found. Cannot add execution.',
      });
      return;
    }

    res.status(200).json(updatedCase);

    // Notify watchers of a new test execution
    await notifyTestCaseChange(
      id,
      'executionAdded',
      `Execution status: ${execData.status}. Actual results: ${execData.actualResults}`
    );

  } catch (err: any) {
    console.error('Error adding test execution:', err);
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET Distinct Applications
 */
export async function getApplicationsController(req: Request, res: Response) {
  try {
    const apps = await TestCase.distinct('application').exec();
    res.status(200).json({ applications: apps });
  } catch (error) {
    console.error('Error getting distinct applications:', error);
    res.status(400).json({ message: 'Failed to get applications.' });
  }
}

/**
 * ADD Test Attachment
 */
export async function addTestCaseAttachmentController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const testCase = await getTestCaseById(id);
    if (!testCase) {
      res.status(404).json({ message: 'TestCase not found' });
      return;
    }

    // S3 file URL or local file URL
    const fileUrl = (req.file as any).location || ''; 
    const attachment = {
      filename: req.file.originalname,
      url: fileUrl,
      uploadedAt: new Date(),
      fileType: req.file.mimetype,
    };

    const updatedAttachments = [...(testCase.attachments || []), attachment];
    const updatedCase = await updateTestCase(id, { attachments: updatedAttachments });
    if (!updatedCase) {
      res.status(404).json({ message: 'TestCase update failed or not found' });
      return;
    }

    res.status(200).json(updatedCase);

    // Notify watchers
    await notifyTestCaseChange(
      id,
      'attachmentAdded',
      `File attached: ${req.file.originalname}`
    );

  } catch (error) {
    console.error('Error uploading file to test case:', error);
    res.status(500).json({ message: 'Error uploading attachment' });
  }
}

/**
 * DELETE a Test Case Attachment
 */
export async function deleteTestCaseAttachmentController(req: Request, res: Response) {
  try {
    const { id, attachmentId } = req.params;

    const updated = await TestCase.findByIdAndUpdate(
      id,
      { $pull: { attachments: { _id: attachmentId } } },
      { new: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('executions.executedBy', 'name email')
      .exec();

    if (!updated) {
      res
        .status(404)
        .json({ message: 'Could not remove attachment (or testCase not found)' });
      return;
    }

    res.status(200).json(updated);

    // Notify watchers
    await notifyTestCaseChange(
      id,
      'attachmentRemoved',
      `Removed attachmentId: ${attachmentId}`
    );

  } catch (err) {
    console.error('Error deleting attachment', err);
    res.status(500).json({ message: 'Server Error' });
  }
}

/**
 * GET /test-cases/analysis
 */
export async function getTestAnalysis(req: Request, res: Response) {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$application',
          total: { $sum: 1 },
          totalPass: {
            $sum: {
              $size: {
                $filter: {
                  input: '$executions',
                  as: 'exe',
                  cond: { $eq: ['$$exe.status', 'Pass'] },
                },
              },
            },
          },
          totalFail: {
            $sum: {
              $size: {
                $filter: {
                  input: '$executions',
                  as: 'exe',
                  cond: { $eq: ['$$exe.status', 'Fail'] },
                },
              },
            },
          },
          totalBlocked: {
            $sum: {
              $size: {
                $filter: {
                  input: '$executions',
                  as: 'exe',
                  cond: { $eq: ['$$exe.status', 'Blocked'] },
                },
              },
            },
          },
          totalRetest: {
            $sum: {
              $size: {
                $filter: {
                  input: '$executions',
                  as: 'exe',
                  cond: { $eq: ['$$exe.status', 'Retest'] },
                },
              },
            },
          },
        },
      },
    ];

    const result = await TestCase.aggregate(pipeline).exec();
    const totalTestCases = await TestCase.countDocuments();

    // Example of overall pass count
    const totalPass = await TestCase.aggregate([
      {
        $project: {
          count: {
            $size: {
              $filter: {
                input: '$executions',
                as: 'exe',
                cond: { $eq: ['$$exe.status', 'Pass'] },
              },
            },
          },
        },
      },
      { $group: { _id: null, sum: { $sum: '$count' } } },
    ]);

    res.status(200).json({
      totalTestCases,
      totalPass: totalPass?.[0]?.sum ?? 0,
      byApplication: result,
    });

    // Usually no email for just analysis fetch

  } catch (error) {
    console.error('Error getting test analysis:', error);
    res.status(500).json({ message: 'Failed to get test analysis' });
  }
}

/**
 * LINK Requirement
 */
export async function linkRequirementController(req: Request, res: Response) {
  try {
    const { id } = req.params; // testCase ID
    const { requirementId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(requirementId)
    ) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    const [testCase, requirement] = await Promise.all([
      TestCase.findById(id),
      Requirement.findById(requirementId),
    ]);

    if (!testCase || !requirement) {
      res
        .status(404)
        .json({ message: 'Either TestCase or Requirement not found' });
      return;
    }

    if (testCase.application !== requirement.application) {
      res.status(400).json({
        message: `Cannot link Requirement from a different application.
          TestCase application: ${testCase.application},
          Requirement application: ${requirement.application}`,
      });
      return;
    }

    const updatedTestCase = await TestCase.findByIdAndUpdate(
      id,
      { $addToSet: { requirementIds: requirementId } },
      { new: true }
    )
      .populate('requirementIds')
      .exec();

    if (!updatedTestCase) {
      res.status(404).json({ message: 'TestCase not found after update' });
      return;
    }

    res.status(200).json(updatedTestCase);

    // Notify watchers
    await notifyTestCaseChange(
      id,
      'requirementLinked',
      `Linked Requirement: ${requirementId}`
    );

  } catch (err) {
    console.error('Error linking requirement:', err);
    res.status(500).json({ message: 'Server Error' });
  }
}

/**
 * UNLINK Requirement
 */
export async function unlinkRequirementController(req: Request, res: Response) {
  try {
    const { id } = req.params; // testCase ID
    const { requirementId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(requirementId)
    ) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    const [testCase, requirement] = await Promise.all([
      TestCase.findById(id),
      Requirement.findById(requirementId),
    ]);
    if (!testCase || !requirement) {
      res
        .status(404)
        .json({ message: 'Either TestCase or Requirement not found' });
      return;
    }

    if (testCase.application !== requirement.application) {
      res.status(400).json({
        message: `Cannot unlink Requirement from a different application.
          TestCase application: ${testCase.application},
          Requirement application: ${requirement.application}`,
      });
      return;
    }

    const updatedTestCase = await TestCase.findByIdAndUpdate(
      id,
      { $pull: { requirementIds: requirementId } },
      { new: true }
    )
      .populate('requirementIds')
      .exec();

    if (!updatedTestCase) {
      res.status(404).json({ message: 'TestCase not found' });
      return;
    }

    res.status(200).json(updatedTestCase);

    // Notify watchers
    await notifyTestCaseChange(
      id,
      'requirementUnlinked',
      `Unlinked Requirement: ${requirementId}`
    );

  } catch (err) {
    console.error('Error unlinking requirement:', err);
    res.status(500).json({ message: 'Server Error' });
  }
}

/**
 * GET Personal Test Cases
 */
export async function getPersonalTestCasesController(req: Request, res: Response) {
  try {
    const {
      assignedTo,
      createdBy,
      search,
      page,
      limit,
      sortField,
      sortOrder,
    } = req.query;

    const options: GetPersonalTestCasesOptions = {
      assignedTo: assignedTo ? String(assignedTo) : undefined,
      createdBy: createdBy ? String(createdBy) : undefined,
      search: search ? String(search) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      sortField: sortField ? String(sortField) : 'testId',
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
    };

    const result = await getPersonalTestCases(options);
    res.status(200).json(result);

    // Typically no email on a "GET" that doesn't change data
  } catch (err) {
    console.error('Error fetching personal test cases:', err);
    res.status(400).json({ message: 'Error fetching personal test cases' });
  }
}
