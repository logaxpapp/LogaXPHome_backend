import Survey, { ISurvey } from '../models/Survey';
import SurveyAssignment, { ISurveyAssignment } from '../models/SurveyAssignment';
import SurveyResponse, { ISurveyResponse } from '../models/SurveyResponse';
import User from '../models/User';
import mongoose from 'mongoose';

// Create a new survey
export const createSurvey = async (surveyData: Partial<ISurvey>): Promise<ISurvey> => {
  const survey = new Survey(surveyData);
  return await survey.save();
};

// Assign survey to users
export const assignSurvey = async (
    surveyId: mongoose.Types.ObjectId,
    userIds: string[],
    dueDate?: Date
  ): Promise<ISurveyAssignment[]> => {
    const assignments = userIds.map(userId => {
      // Validate and convert userId to ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error(`Invalid user ID: ${userId}`);
      }
  
      return {
        survey: surveyId,
        user: new mongoose.Types.ObjectId(userId),
        due_date: dueDate,
      };
    });
  
    const insertedAssignments = await SurveyAssignment.insertMany(assignments);
    
    // Optionally, you can populate the 'user' and 'survey' fields
    return insertedAssignments;
  };

  export const assignSurveyToUsersAndEmails = async (
    surveyId: string,
    userIds: string[] = [],
    emails: string[] = [],
    dueDate?: Date
  ): Promise<ISurveyAssignment[]> => {
    // Define assignments with Partial type
    const assignments: Partial<ISurveyAssignment>[] = [];
  
    // Assign to registered users
    userIds.forEach((userId) => {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        assignments.push({ survey: new mongoose.Types.ObjectId(surveyId), user: new mongoose.Types.ObjectId(userId), due_date: dueDate });
      }
    });
  
    // Assign to email addresses for non-registered participants
    emails.forEach((email) => {
      assignments.push({ survey: new mongoose.Types.ObjectId(surveyId), email, due_date: dueDate });
    });
  
    // Insert assignments and return as ISurveyAssignment[]
    return await SurveyAssignment.insertMany(assignments) as ISurveyAssignment[];
  };

  
// Get surveys assigned to a user
export const getUserSurveys = async (userId: string | mongoose.Types.ObjectId, status: 'Pending' | 'Completed') => {
  const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  return await SurveyAssignment.find({ user: objectId, status })
    .populate('survey') // Populate survey details
    .exec();
};
export const submitSurveyResponses = async (
  assignmentId: string,
  responses: ISurveyResponse[]
): Promise<ISurveyResponse> => {
  const assignment = await SurveyAssignment.findById(new mongoose.Types.ObjectId(assignmentId));

  if (!assignment) throw new Error('Survey assignment not found');
  if (assignment.status === 'Completed') throw new Error('Survey already completed');

  // Check if a response already exists for this assignment
  const existingResponse = await SurveyResponse.findOne({ survey_assignment: assignment._id });
  if (existingResponse) {
    throw new Error('Response already submitted for this survey assignment');
  }

  // Create and save the new survey response
  const surveyResponse = new SurveyResponse({
    survey_assignment: assignment._id,
    responses,
  });

  await surveyResponse.save();

  // Update assignment status to completed
  assignment.status = 'Completed';
  assignment.completed_at = new Date();
  await assignment.save();

  return surveyResponse;
};

// Get survey responses (Admin)
export const getSurveyResponses = async (surveyId: string) => {
  const assignments = await SurveyAssignment.find({ survey: surveyId, status: 'Completed' })
    .populate('user')
    .exec();

  const responses = await SurveyResponse.find({
    survey_assignment: { $in: assignments.map(a => a._id) },
  })
    .populate({
      path: 'survey_assignment',
      populate: { path: 'user', select: 'name email' },
    })
    .exec();

  return responses;
};

export const deleteSurvey = async (surveyId: string) => {
  const survey = await Survey.findByIdAndDelete(surveyId);
  if (!survey) throw new Error('Survey not found');
  return survey;
}


export const updateSurvey = async (surveyId: string, surveyData: Partial<ISurvey>): Promise<ISurvey | null> => {
  return await Survey.findByIdAndUpdate(surveyId, surveyData, { new: true });
};

export const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
  if (!mongoose.Types.ObjectId.isValid(surveyId)) {
    throw new Error('Invalid survey ID');
  }
  
  return await Survey.findById(surveyId).exec();
};


export const getAllSurveys = async (): Promise<ISurvey[]> => {
  return await Survey.find().exec();
};

export const getSurveyAssignments = async (surveyId: string): Promise<ISurveyAssignment[]> => {
  return await SurveyAssignment.find({ survey: surveyId }).populate('user', 'name email').exec();
};

export const getSurveyAssignmentById = async (assignmentId: string): Promise<ISurveyAssignment | null> => {
  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    console.error('Invalid assignment ID format:', assignmentId);
    throw new Error('Invalid assignment ID');
  }
  
  const assignment = await SurveyAssignment.findById(assignmentId)
    .populate('survey') // Populate survey details
    .exec();
  
  if (!assignment) {
    console.error('Survey assignment not found for ID:', assignmentId);
  }

  return assignment;
};

      // 1. Get responses by survey ID
      export const getResponsesBySurveyId = async (surveyId: string) => {
        if (!mongoose.Types.ObjectId.isValid(surveyId)) throw new Error('Invalid survey ID');

        // Find responses associated with a specific survey
        return await SurveyResponse.find({ 'survey_assignment.survey': surveyId }).populate({
          path: 'survey_assignment',
          populate: { path: 'survey' },
        });
      };

      // 2. Get all survey responses
     // Service: Get all survey responses (paginated)
export const getAllSurveyResponses = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  // Find responses with pagination
  const [responses, total] = await Promise.all([
    SurveyResponse.find()
      .populate({
        path: 'survey_assignment',
        populate: { path: 'survey' },
      })
      .skip(skip)
      .limit(limit),
    SurveyResponse.countDocuments(),
  ]);

  const pages = Math.ceil(total / limit);

  return { responses, total, pages };
};


      // Get all responses submitted by a specific user
      export const getResponsesByUserPaginated = async (
        userId: string | mongoose.Types.ObjectId,
        userEmail?: string,
        page = 1,
        limit = 10
      ) => {
        const query: any = { $or: [] };
      
        if (mongoose.Types.ObjectId.isValid(userId)) {
          query.$or.push({ 'survey_assignment.user': userId });
        }
      
        if (userEmail) {
          query.$or.push({ 'survey_assignment.email': userEmail });
        }
      
        const skip = (page - 1) * limit;
      
        const [responses, total] = await Promise.all([
          SurveyResponse.find(query)
            .populate({
              path: 'survey_assignment',
              populate: { path: 'survey', select: 'title description' },
            })
            .populate({
              path: 'responses.question_id',
              select: 'question_text question_type options',
            })
            .skip(skip)
            .limit(limit)
            .exec(),
          SurveyResponse.countDocuments(query),
        ]);
      
        return { responses, total, page, pages: Math.ceil(total / limit) };
      };
      

      export const getResponsesByUserIdOrEmail = async (
        userId: mongoose.Types.ObjectId | undefined,
        userEmail?: string
      ) => {
        const query: any = { $or: [] };
      
        if (userId) {
          query.$or.push({ 'survey_assignment.user': userId });
        }
      
        if (userEmail) {
          query.$or.push({ 'survey_assignment.email': userEmail });
        }
      
        if (query.$or.length === 0) {
          throw new Error('No valid userId or userEmail provided.');
        }
      
        return await SurveyResponse.find(query)
          .populate({
            path: 'survey_assignment',
            populate: { path: 'survey', select: 'title description' },
          })
          .populate({
            path: 'responses.question_id',
            select: 'question_text question_type options',
          })
          .exec();
      };
      
    