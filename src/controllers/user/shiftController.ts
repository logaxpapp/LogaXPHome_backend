// src/controllers/user/shiftController.ts

import { Request, Response } from 'express';
import {
  getAllShiftsPaginated,
  requestShiftAssignment,
  pickOpenShift,
  getShiftsByEmployee,
} from '../../services/shiftService';
import { IUser } from '../../models/User';
import { ShiftStatus } from '../../models/Shift';

// Interface for Authenticated Request
interface AuthRequest extends Request {
  user?: IUser;
}

// View Employee's Schedule
export const viewScheduleHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      // Fetch shifts assigned to the user
      const filters = { assignedTo: user._id };
      const pagination = {
        page: 1,
        limit: 100, // Adjust as needed
      };
      const { shifts, total } = await getAllShiftsPaginated(filters, pagination);
  
      res.status(200).json({ shifts, total });
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Failed to fetch schedule' });
    }
  };
  

// Request to Pick an Open Shift
export const requestShiftHandler = async (req: AuthRequest, res: Response) => {
  try {
  
    const { shiftId } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!shiftId) {
      res.status(400).json({ message: 'shiftId is required' });
      return;
    }

    const shift = await requestShiftAssignment(shiftId, user._id.toString());

    res.status(200).json({ shift });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to request shift' });
  }
};

export const assignShiftHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { shiftId } = req.body;
  
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      if (!shiftId) {
        res.status(400).json({ message: 'shiftId is required' });
        return;
      }
  
      const shift = await pickOpenShift(shiftId, user._id.toString());
  
      res.status(200).json({ shift });
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Failed to assign shift' });
    }
  };



export const fetchShiftsByEmployeeController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const shifts = await getShiftsByEmployee(employeeId);
    res.status(200).json(shifts);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Failed to fetch shifts for the employee';
    res.status(status).json({ message });
  }
};

  
