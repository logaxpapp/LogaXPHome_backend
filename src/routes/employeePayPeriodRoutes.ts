import { Router } from 'express';
import {
    getEmployeePayPeriodsForPayPeriodController,
    getEmployeePayPeriodsController, // Corrected import
    getEmployeePayPeriodByIdController,
    createEmployeePayPeriodController,
    updateEmployeePayPeriodController,
    deleteEmployeePayPeriodController,
  } from '../controllers/employeePayPeriodController';
  
import { authenticateJWT } from '../middlewares/authMiddleware';
import { getEmployeePayPeriodSummaryController } from '../controllers/payPeriodController';

const router = Router();

// Middleware for authentication
router.use(authenticateJWT);

// Get all EmployeePayPeriods for a specific PayPeriod
router.get('/payPeriod/:payPeriodId', getEmployeePayPeriodsForPayPeriodController);

// Get all EmployeePayPeriods for a specific Employee
router.get('/employee/:employeeId', getEmployeePayPeriodsController); // Corrected function


// Get detailed summary of EmployeePayPeriod by Employee and PayPeriod
router.get('/summary/:payPeriodId/:employeeId', getEmployeePayPeriodSummaryController);

// Get a specific EmployeePayPeriod by ID
router.get('/:id', getEmployeePayPeriodByIdController);

// Create an EmployeePayPeriod (manual route, rarely used)
router.post('/', createEmployeePayPeriodController);

// Update an EmployeePayPeriod
router.put('/:id', updateEmployeePayPeriodController);

// Delete an EmployeePayPeriod
router.delete('/:id', deleteEmployeePayPeriodController);

export default router;
