import express from 'express';
import {
  createSurveyHandler,
  assignSurveyHandler,
  getUserSurveysHandler,
  submitSurveyResponsesHandler,
  getSurveyResponsesHandler,
  deleteSurveyHandler, 
  assignSurveysHandler,
  updateSurveyHandler,
  getSurveyDetailsHandler,
  getAllSurveysHandler,
  getSurveyAssignmentsHandler,
  getSurveyAssignmentByIdHandler,
  getAllSurveyResponsesHandler,
  getPaginatedUserSurveyResponsesHandler,
  getUserSurveyResponsesByIdOrEmailHandler
} from '../controllers/surveyController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

// Admin routes
router.post(
  '/admin',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  createSurveyHandler
);

router.post(
  '/admin/:surveyId/assign',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  assignSurveyHandler
);
router.get('/:surveyId/assignments',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getSurveyAssignmentsHandler
);

// In survey routes (add this to your existing routes)
router.get(
  '/admin/:surveyId/responses',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getSurveyResponsesHandler // This handler will get all responses for a particular survey
);
router.get(
  '/admin/responses',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getAllSurveyResponsesHandler // This would get all responses across all surveys
);


router.delete(
  '/admin/:surveyId',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  deleteSurveyHandler
);

router.put(
  '/admin/:surveyId',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  updateSurveyHandler
);

router.get(
  '/admin/surveys',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getAllSurveysHandler
);

// User routes
router.get('/user/surveys', authenticateJWT, getUserSurveysHandler);

router.get(
  '/user/responses',
  authenticateJWT,
  getPaginatedUserSurveyResponsesHandler 
);

router.get(
  '/user/responses/:surveyId',
  authenticateJWT,
  getUserSurveyResponsesByIdOrEmailHandler
);

// Route to get survey assignment by assignmentId
router.get('/:assignmentId', authenticateJWT, getSurveyAssignmentByIdHandler);

router.post(
  '/:assignmentId/responses',
  authenticateJWT,
  submitSurveyResponsesHandler
);

router.get(
  '/surveys/:surveyId',
  authenticateJWT,
  getSurveyDetailsHandler
);




export default router;
