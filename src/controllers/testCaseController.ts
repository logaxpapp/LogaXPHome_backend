// "I want the vital message at all time."
// src/controllers/testCaseController.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
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
} from '../services/testCaseService';
import { UserRole } from '../types/enums';
import TestCase from '../models/TestCase';
import Requirement from '../models/Requirement';

/**
 * CREATE Test Case
 * - Receives data for new test case creation.
 * - Merges with the authenticated user ID as `createdBy`.
 */
export async function createTestCaseController(req: Request, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
       res.status(400).json({ message: 'User ID is required or not found in request' });
        return
    }

    const data = { 
      ...req.body,
      createdBy: userId,
    };

    const newCase = await createTestCase(data);
     res.status(201).json(newCase);
        return;
  } catch (err: any) {
    console.error('Error creating test case:', err);
     res.status(400).json({ message: err.message });
     return;
  }
}

/**
 * GET All Test Cases
 * - Allows optional filtering by application, environment, status, search text.
 * - Supports pagination & sorting.
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
    // result: { testCases, total }

     res.status(200).json(result);
     return;
  } catch (err) {
    console.error('Error fetching test cases:', err);
     res.status(400).json({ message: 'Error fetching test cases' });
        return
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
     return;
  } catch (err: any) {
     res.status(400).json({ message: err.message });
        return;
  }
}

/**
 * UPDATE Test Case (general fields)
 * - This can update any new fields like priority, severity, tags, etc.
 */
export async function updateTestCaseController(req: Request, res: Response) {
    try {
      const { id } = req.params;
  
      // data from request body
      const data = req.body;
      
      // userId from auth
      const userId = req.user?._id ? req.user._id.toString() : undefined;
  
      const updated = await updateTestCase(id, data, userId);
      if (!updated) {
         res.status(404).json({ message: 'TestCase not found or not updated' });
         return;
      }
       res.status(200).json(updated);
       return;
    } catch (err: any) {
       res.status(400).json({ message: err.message });
         return;
    }
  }
  

/**
 * DELETE Test Case
 * - Only Admins or the original creator can delete a test case.
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
    const isCreator = req.user._id.toString() === testCase.createdBy.toString();

    if (!isAdmin && !isCreator) {
       res.status(403).json({
        message: 'You must be an Admin or the creator to delete this test case',
      });
      return;
    }

    const success = await deleteTestCase(id);
    if (!success) {
       res.status(500).json({ message: 'Failed to delete test case. Please try again.' });
        return
    }

     res.status(200).json({ message: 'Test Case deleted successfully' });
    return;
  } catch (err: unknown) {
    if (err instanceof Error) {
       res.status(500).json({ message: err.message });
        return;
    }
     res.status(500).json({
      message: 'An unknown error occurred while deleting the test case',
    });
    return;
  }
}

/**
 * ASSIGN Test Case to a user
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
        return;
  } catch (err: any) {
    console.error('Error assigning test case:', err);
     res.status(400).json({ message: err.message });
        return;
  }
}

/**
 * ADD Test Execution
 * - If "Fail," automatically creates a new ticket.
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
        return;
  } catch (err: any) {
    console.error('Error adding test execution:', err);
     res.status(400).json({ message: err.message });
        return;
  }
}

/**
 * GET Distinct Applications from TestCase documents
 */
export async function getApplicationsController(req: Request, res: Response) {
  try {
    const apps = await TestCase.distinct('application').exec();
     res.status(200).json({ applications: apps });
     return;
  } catch (error) {
    console.error('Error getting distinct applications:', error);
     res.status(400).json({ message: 'Failed to get applications.' });
        return;
  }
}

/**
 * ADD Test Attachment
 * - Handles file uploads via multer (S3 or local).
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

    // S3 info may be in req.file.location or req.file.key
    const fileUrl = (req.file as any).location; 
    // const fileKey = (req.file as any).key; // example: 'documents/userId/...'

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
        return;
  } catch (error) {
    console.error('Error uploading file to test case:', error);
     res.status(500).json({ message: 'Error uploading attachment' });
        return;
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
        return
  } catch (err) {
    console.error('Error deleting attachment', err);
     res.status(500).json({ message: 'Server Error' });
        return;
  }
}

/**
 * GET /test-cases/analysis
 */
export async function getTestAnalysis(req: Request, res: Response) {
    try {
      // An updated pipeline that counts pass, fail, blocked, retest
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
  
      // We can also get overall pass/fail/blocked/retest counts:
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
  
      // Or do similarly for fail, blocked, retest, or just reduce the result array if you prefer.
  
      res.status(200).json({
        totalTestCases,
        totalPass: totalPass?.[0]?.sum ?? 0,
        // similarly totalFail, totalBlocked, totalRetest, or do them in pipeline
        byApplication: result,
      });
    } catch (error) {
      console.error('Error getting test analysis:', error);
      res.status(500).json({ message: 'Failed to get test analysis' });
    }
  }
  

 /**
 * LINK Requirement (with application check).
 */
export async function linkRequirementController(req: Request, res: Response) {
    try {
      const { id } = req.params; // testCase ID
      const { requirementId } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requirementId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
  
      // 1) Fetch both the testCase & requirement
      const [testCase, requirement] = await Promise.all([
        TestCase.findById(id),
        Requirement.findById(requirementId),
      ]);
  
      if (!testCase || !requirement) {
        return res
          .status(404)
          .json({ message: 'Either TestCase or Requirement not found' });
      }
  
      // 2) Ensure both share the same application
      if (testCase.application !== requirement.application) {
        return res.status(400).json({
          message: `Cannot link Requirement from a different application.
          TestCase application: ${testCase.application},
          Requirement application: ${requirement.application}`,
        });
      }
  
      // 3) $addToSet to avoid duplicates
      const updatedTestCase = await TestCase.findByIdAndUpdate(
        id,
        { $addToSet: { requirementIds: requirementId } },
        { new: true }
      )
        .populate('requirementIds')
        .exec();
  
      if (!updatedTestCase) {
        return res.status(404).json({ message: 'TestCase not found after update' });
      }
  
      return res.status(200).json(updatedTestCase);
    } catch (err) {
      console.error('Error linking requirement:', err);
      return res.status(500).json({ message: 'Server Error' });
    }
  }
  
  /**
   * UNLINK Requirement (optional application check).
   */
  export async function unlinkRequirementController(req: Request, res: Response) {
    try {
      const { id } = req.params; // testCase ID
      const { requirementId } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requirementId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
  
      // Optionally fetch them if you want to confirm they match application:
      // (But usually for unlink we might not care.)
      const [testCase, requirement] = await Promise.all([
        TestCase.findById(id),
        Requirement.findById(requirementId),
      ]);
      if (!testCase || !requirement) {
        return res
          .status(404)
          .json({ message: 'Either TestCase or Requirement not found' });
      }
  
      // If you want to block unlink if they differ in application (rare case):
      if (testCase.application !== requirement.application) {
        return res.status(400).json({
          message: `Cannot unlink Requirement from a different application.
          TestCase application: ${testCase.application},
          Requirement application: ${requirement.application}`,
        });
      }
  
      const updatedTestCase = await TestCase.findByIdAndUpdate(
        id,
        { $pull: { requirementIds: requirementId } },
        { new: true }
      )
        .populate('requirementIds')
        .exec();
  
      if (!updatedTestCase) {
        return res.status(404).json({ message: 'TestCase not found' });
      }
  
      return res.status(200).json(updatedTestCase);
    } catch (err) {
      console.error('Error unlinking requirement:', err);
      return res.status(500).json({ message: 'Server Error' });
    }
  }



//   // "I want the vital message at all time."
// // src/controllers/testCaseController.ts

// import { Request, Response } from 'express';
// import mongoose from 'mongoose';
// import {
//   createTestCase,
//   getAllTestCases,
//   getTestCaseById,
//   updateTestCase,
//   deleteTestCase,
//   assignTestCase,
//   addTestExecution,
//   IAddExecutionPayload,
//   GetAllTestCasesOptions,
// } from '../services/testCaseService';
// import { UserRole } from '../types/enums';
// import TestCase from '../models/TestCase';
// import Requirement from '../models/Requirement';

// export async function createTestCaseController(req: Request, res: Response) {
//   try {
//     const userId = req.user?._id;
//     if (!userId) {
//       res.status(400).json({ message: 'User ID is required or not found in request' });
//       return;
//     }

//     // Make sure we have application in the body or set a default
//     if (!req.body.application) {
//       return res
//         .status(400)
//         .json({ message: 'application field is required for creating a test case' });
//     }

//     const data = {
//       ...req.body,
//       createdBy: userId,
//     };

//     const newCase = await createTestCase(data);
//     res.status(201).json(newCase);
//   } catch (err: any) {
//     console.error('Error creating test case:', err);
//     res.status(400).json({ message: err.message });
//   }
// }

// export async function getAllTestCasesController(req: Request, res: Response) {
//   try {
//     const {
//       application,
//       environment,
//       status,
//       search,
//       page,
//       limit,
//       sortField,
//       sortOrder,
//     } = req.query;

//     const options: GetAllTestCasesOptions = {
//       application: application ? String(application) : undefined,
//       environment: environment ? String(environment) : undefined,
//       status: status ? String(status) : undefined,
//       search: search ? String(search) : undefined,
//       page: page ? parseInt(page as string, 10) : 1,
//       limit: limit ? parseInt(limit as string, 10) : 10,
//       sortField: sortField ? String(sortField) : 'testId',
//       sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
//     };

//     const result = await getAllTestCases(options);
//     // result: { testCases, total }
//     res.status(200).json(result);
//   } catch (err) {
//     console.error('Error fetching test cases:', err);
//     res.status(400).json({ message: 'Error fetching test cases' });
//   }
// }

// export async function getTestCaseController(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const testCase = await getTestCaseById(id);
//     if (!testCase) {
//       res.status(404).json({ message: 'TestCase not found' });
//       return;
//     }
//     res.status(200).json(testCase);
//   } catch (err: any) {
//     res.status(400).json({ message: err.message });
//   }
// }

// export async function updateTestCaseController(req: Request, res: Response) {
//   try {
//     const { id } = req.params;

//     // userId from auth
//     const userId = req.user?._id ? req.user._id.toString() : undefined;

//     const updated = await updateTestCase(id, req.body, userId);
//     if (!updated) {
//       res.status(404).json({ message: 'TestCase not found or not updated' });
//       return;
//     }
//     res.status(200).json(updated);
//   } catch (err: any) {
//     res.status(400).json({ message: err.message });
//   }
// }

// export async function deleteTestCaseController(req: Request, res: Response) {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       res.status(400).json({ message: 'Invalid Test Case ID format' });
//       return;
//     }

//     const testCase = await TestCase.findById(id);
//     if (!testCase) {
//       res.status(404).json({ message: 'TestCase not found' });
//       return;
//     }

//     if (!req.user) {
//       res.status(401).json({ message: 'Unauthorized: No user logged in' });
//       return;
//     }

//     const isAdmin = req.user.role === UserRole.Admin;
//     const isCreator = req.user._id.toString() === testCase.createdBy.toString();

//     if (!isAdmin && !isCreator) {
//       res.status(403).json({
//         message: 'You must be an Admin or the creator to delete this test case',
//       });
//       return;
//     }

//     const success = await deleteTestCase(id);
//     if (!success) {
//       res.status(500).json({ message: 'Failed to delete test case. Please try again.' });
//       return;
//     }

//     res.status(200).json({ message: 'Test Case deleted successfully' });
//   } catch (err: unknown) {
//     if (err instanceof Error) {
//       res.status(500).json({ message: err.message });
//       return;
//     }
//     res
//       .status(500)
//       .json({ message: 'An unknown error occurred while deleting the test case' });
//   }
// }

// export async function assignTestCaseController(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const { userId } = req.body;

//     if (!userId) {
//       res.status(400).json({ message: 'Missing userId' });
//       return;
//     }
//     const objectId = new mongoose.Types.ObjectId(userId);

//     const updated = await assignTestCase(id, objectId);
//     if (!updated) {
//       res.status(404).json({ message: 'TestCase not found or not updated' });
//       return;
//     }
//     res.status(200).json(updated);
//   } catch (err: any) {
//     console.error('Error assigning test case:', err);
//     res.status(400).json({ message: err.message });
//   }
// }

// export async function addTestExecutionController(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const execData = req.body as IAddExecutionPayload;

//     if (!execData.executedBy || !execData.actualResults || !execData.status) {
//       res.status(400).json({
//         message:
//           'executedBy, actualResults, and status are required fields for test execution',
//       });
//       return;
//     }

//     const updatedCase = await addTestExecution(id, execData);
//     if (!updatedCase) {
//       res.status(404).json({
//         message: 'TestCase not found. Cannot add execution.',
//       });
//       return;
//     }

//     res.status(200).json(updatedCase);
//   } catch (err: any) {
//     console.error('Error adding test execution:', err);
//     res.status(400).json({ message: err.message });
//   }
// }

// export async function getApplicationsController(req: Request, res: Response) {
//   try {
//     const apps = await TestCase.distinct('application').exec();
//     res.status(200).json({ applications: apps });
//   } catch (error) {
//     console.error('Error getting distinct applications:', error);
//     res.status(400).json({ message: 'Failed to get applications.' });
//   }
// }

// export async function addTestCaseAttachmentController(req: Request, res: Response) {
//   try {
//     const { id } = req.params;

//     if (!req.file) {
//       res.status(400).json({ message: 'No file uploaded' });
//       return;
//     }

//     const testCase = await getTestCaseById(id);
//     if (!testCase) {
//       res.status(404).json({ message: 'TestCase not found' });
//       return;
//     }

//     const fileUrl = (req.file as any).location;
//     const attachment = {
//       filename: req.file.originalname,
//       url: fileUrl,
//       uploadedAt: new Date(),
//       fileType: req.file.mimetype,
//     };

//     const updatedAttachments = [...(testCase.attachments || []), attachment];
//     const updatedCase = await updateTestCase(id, { attachments: updatedAttachments });

//     if (!updatedCase) {
//       res.status(404).json({ message: 'TestCase update failed or not found' });
//       return;
//     }

//     res.status(200).json(updatedCase);
//   } catch (error) {
//     console.error('Error uploading file to test case:', error);
//     res.status(500).json({ message: 'Error uploading attachment' });
//   }
// }

// export async function deleteTestCaseAttachmentController(req: Request, res: Response) {
//   try {
//     const { id, attachmentId } = req.params;

//     const updated = await TestCase.findByIdAndUpdate(
//       id,
//       { $pull: { attachments: { _id: attachmentId } } },
//       { new: true }
//     )
//       .populate('assignedTo', 'name email')
//       .populate('createdBy', 'name email')
//       .populate('executions.executedBy', 'name email')
//       .exec();

//     if (!updated) {
//       res
//         .status(404)
//         .json({ message: 'Could not remove attachment (or testCase not found)' });
//       return;
//     }

//     res.status(200).json(updated);
//   } catch (err) {
//     console.error('Error deleting attachment', err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// }

// export async function getTestAnalysis(req: Request, res: Response) {
//   try {
//     const pipeline = [
//       {
//         $group: {
//           _id: '$application',
//           total: { $sum: 1 },
//           totalPass: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: '$executions',
//                   as: 'exe',
//                   cond: { $eq: ['$$exe.status', 'Pass'] },
//                 },
//               },
//             },
//           },
//           totalFail: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: '$executions',
//                   as: 'exe',
//                   cond: { $eq: ['$$exe.status', 'Fail'] },
//                 },
//               },
//             },
//           },
//           totalBlocked: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: '$executions',
//                   as: 'exe',
//                   cond: { $eq: ['$$exe.status', 'Blocked'] },
//                 },
//               },
//             },
//           },
//           totalRetest: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: '$executions',
//                   as: 'exe',
//                   cond: { $eq: ['$$exe.status', 'Retest'] },
//                 },
//               },
//             },
//           },
//         },
//       },
//     ];

//     const result = await TestCase.aggregate(pipeline).exec();
//     const totalTestCases = await TestCase.countDocuments();

//     const totalPass = await TestCase.aggregate([
//       {
//         $project: {
//           count: {
//             $size: {
//               $filter: {
//                 input: '$executions',
//                 as: 'exe',
//                 cond: { $eq: ['$$exe.status', 'Pass'] },
//               },
//             },
//           },
//         },
//       },
//       { $group: { _id: null, sum: { $sum: '$count' } } },
//     ]);

//     res.status(200).json({
//       totalTestCases,
//       totalPass: totalPass?.[0]?.sum ?? 0,
//       byApplication: result,
//     });
//   } catch (error) {
//     console.error('Error getting test analysis:', error);
//     res.status(500).json({ message: 'Failed to get test analysis' });
//   }
// }

// /**
//  * LINK Requirement (with application check).
//  */
// export async function linkRequirementController(req: Request, res: Response) {
//   try {
//     const { id } = req.params; // testCase ID
//     const { requirementId } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requirementId)) {
//       return res.status(400).json({ message: 'Invalid ID format' });
//     }

//     // 1) Fetch both the testCase & requirement
//     const [testCase, requirement] = await Promise.all([
//       TestCase.findById(id),
//       Requirement.findById(requirementId),
//     ]);

//     if (!testCase || !requirement) {
//       return res
//         .status(404)
//         .json({ message: 'Either TestCase or Requirement not found' });
//     }

//     // 2) Ensure both share the same application
//     if (testCase.application !== requirement.application) {
//       return res.status(400).json({
//         message: `Cannot link Requirement from a different application.
//         TestCase application: ${testCase.application},
//         Requirement application: ${requirement.application}`,
//       });
//     }

//     // 3) $addToSet to avoid duplicates
//     const updatedTestCase = await TestCase.findByIdAndUpdate(
//       id,
//       { $addToSet: { requirementIds: requirementId } },
//       { new: true }
//     )
//       .populate('requirementIds')
//       .exec();

//     if (!updatedTestCase) {
//       return res.status(404).json({ message: 'TestCase not found after update' });
//     }

//     return res.status(200).json(updatedTestCase);
//   } catch (err) {
//     console.error('Error linking requirement:', err);
//     return res.status(500).json({ message: 'Server Error' });
//   }
// }

// /**
//  * UNLINK Requirement (optional application check).
//  */
// export async function unlinkRequirementController(req: Request, res: Response) {
//   try {
//     const { id } = req.params; // testCase ID
//     const { requirementId } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(requirementId)) {
//       return res.status(400).json({ message: 'Invalid ID format' });
//     }

//     // Optionally fetch them if you want to confirm they match application:
//     // (But usually for unlink we might not care.)
//     const [testCase, requirement] = await Promise.all([
//       TestCase.findById(id),
//       Requirement.findById(requirementId),
//     ]);
//     if (!testCase || !requirement) {
//       return res
//         .status(404)
//         .json({ message: 'Either TestCase or Requirement not found' });
//     }

//     // If you want to block unlink if they differ in application (rare case):
//     if (testCase.application !== requirement.application) {
//       return res.status(400).json({
//         message: `Cannot unlink Requirement from a different application.
//         TestCase application: ${testCase.application},
//         Requirement application: ${requirement.application}`,
//       });
//     }

//     const updatedTestCase = await TestCase.findByIdAndUpdate(
//       id,
//       { $pull: { requirementIds: requirementId } },
//       { new: true }
//     )
//       .populate('requirementIds')
//       .exec();

//     if (!updatedTestCase) {
//       return res.status(404).json({ message: 'TestCase not found' });
//     }

//     return res.status(200).json(updatedTestCase);
//   } catch (err) {
//     console.error('Error unlinking requirement:', err);
//     return res.status(500).json({ message: 'Server Error' });
//   }
// }
