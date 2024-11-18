import { Request, Response } from 'express';
import { ISurvey } from '../models/Survey';
import mongoose from 'mongoose';
import {
  createSurvey,
  assignSurvey,
  getUserSurveys,
  submitSurveyResponses,
  getSurveyResponses,
  deleteSurvey,
  assignSurveyToUsersAndEmails,
  updateSurvey,
  getSurveyById,
  getAllSurveys,
  getSurveyAssignments,
  getSurveyAssignmentById,
  getResponsesBySurveyId, 
  getAllSurveyResponses,
  getResponsesByUserPaginated,
  getResponsesByUserIdOrEmail
} from '../services/surveyService';



// Admin: Create a new survey
export const createSurveyHandler = async (req: Request, res: Response) => {
  try {
    const surveyData = { ...req.body, created_by: req.user!._id };
    const survey = await createSurvey(surveyData);
    res.status(201).json(survey);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Assign survey to users
export const assignSurveyHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { surveyId } = req.params;
      const { userIds, dueDate } = req.body;
  
      // Validate surveyId
      if (!mongoose.Types.ObjectId.isValid(surveyId)) {
        res.status(400).json({ message: 'Invalid survey ID' });
        return;
      }
  
      const surveyObjectId = new mongoose.Types.ObjectId(surveyId);
  
      // Assign survey
      const assignments = await assignSurvey(surveyObjectId, userIds, dueDate);
      res.status(201).json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  export const assignSurveysHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { surveyId } = req.params;
      const { userIds, emails, dueDate } = req.body;
  
      const assignments = await assignSurveyToUsersAndEmails(surveyId, userIds, emails, dueDate);
      res.status(201).json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
// User: Get pending or completed surveys
export const getUserSurveysHandler = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as 'Pending' | 'Completed';
    console.log("User ID from token:", req.user!._id);
    console.log("Status filter:", status);

    const surveyAssignments = await getUserSurveys(req.user!._id, status);
    console.log("Survey assignments found:", surveyAssignments);

    // Include both survey details and assignmentId for each survey item
    const surveys = surveyAssignments.map((assignment) => {
      const survey = assignment.survey instanceof mongoose.Types.ObjectId
        ? {} // If survey is not populated, return an empty object or handle as needed
        : (assignment.survey as ISurvey).toObject(); // Populate survey if it is an object

      return {
        ...survey,              // Spread the survey details if populated
        assignmentId: assignment._id, // Include assignmentId in the survey item
      };
    });

    const total = surveys.length;

    res.status(200).json({ surveys, total });
  } catch (error: any) {
    console.error("Error in getUserSurveysHandler:", error);
    res.status(500).json({ message: error.message });
  }
};

// User: Submit survey responses
export const submitSurveyResponsesHandler = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { responses } = req.body;

    // Log the received assignmentId and responses for debugging
    console.log("Received assignmentId:", assignmentId);
    console.log("Received responses:", responses);

    const surveyResponse = await submitSurveyResponses(assignmentId, responses);
    res.status(201).json(surveyResponse);
  } catch (error: any) {
    console.error("Error in submitSurveyResponsesHandler:", error.message);
    res.status(400).json({ message: error.message });
  }
};


// Admin: Delete a survey

export const deleteSurveyHandler = async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const survey = await deleteSurvey(surveyId);
    res.status(200).json(survey);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const updateSurveyHandler = async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const surveyData = req.body;

    const updatedSurvey = await updateSurvey(surveyId, surveyData);
    res.status(200).json(updatedSurvey);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const getSurveyDetailsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { surveyId } = req.params;
    const survey = await getSurveyById(surveyId);

    if (!survey) {
      res.status(404).json({ message: 'Survey not found' });
    } else {
      res.status(200).json(survey);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const getAllSurveysHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const surveys = await getAllSurveys();
    res.status(200).json(surveys);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSurveyAssignmentsHandler = async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const assignments = await getSurveyAssignments(surveyId);
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: (error as any).message });
  }
};

export const getSurveyAssignmentByIdHandler = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await getSurveyAssignmentById(assignmentId);

    if (!assignment) {
      res.status(404).json({ message: 'Survey assignment not found' });
    }

    res.status(200).json(assignment);
  } catch (error: any) {
    console.error('Error fetching survey assignment:', error);
    res.status(500).json({ message: error.message });
  }
};
// Handler to get responses by survey ID
export const getSurveyResponsesHandler = async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const responses = await getResponsesBySurveyId(surveyId);
    res.status(200).json(responses);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: errorMessage });
  }
};

// Handler to get all survey responses
// Controller: Get all survey responses (paginated)
export const getAllSurveyResponsesHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const { responses, total, pages } = await getAllSurveyResponses(page, limit);

    res.status(200).json({ responses, total, pages, page });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: errorMessage });
  }
};




// Handler to get all survey responses for a specific user
// Controller: Paginated responses for a specific user
export const getPaginatedUserSurveyResponsesHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id; // Extract authenticated user's ID
    const userEmail = req.user?.email; // Optionally extract user email if available
    const { page = 1, limit = 10 } = req.query; // Parse pagination parameters

    const { responses, total, pages } = await getResponsesByUserPaginated(
      userId,
      userEmail,
      Number(page),
      Number(limit)
    );

    res.status(200).json({ responses, total, pages, page });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: errorMessage });
  }
};

// Controller: All responses by user ID or email
export const getUserSurveyResponsesByIdOrEmailHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id; // Extract authenticated user's ID
    const userEmail = req.user?.email; // Extract authenticated user's email

    if (!userId && !userEmail) {
      res.status(400).json({ message: 'User ID or email is required.' });
      return;
    }

    const responses = await getResponsesByUserIdOrEmail(userId, userEmail);

    res.status(200).json(responses);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: errorMessage });
  }
};




