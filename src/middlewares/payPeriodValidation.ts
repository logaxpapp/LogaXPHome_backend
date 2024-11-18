import { Request, Response, NextFunction } from 'express';
import PayPeriod, { PayPeriodStatus } from '../models/PayPeriod';
import Shift from '../models/Shift';
import TimeEntry from '../models/TimeEntry';


// Middleware to validate PayPeriod status
export const validatePayPeriodStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { payPeriodId } = req.params;

  try {
    const payPeriod = await PayPeriod.findById(payPeriodId);

    if (!payPeriod) {
      res.status(404).json({ message: 'PayPeriod not found.' });
        return;
    }

    // Attach the payPeriod to the request object for further use
    req.payPeriod = payPeriod;

    next();
  } catch (error: any) {
    res.status(500).json({ message: 'Error validating PayPeriod.' });

  }
};

// Ensure the pay period is open for modifications
export const ensureOpenPayPeriod = (req: Request, res: Response, next: NextFunction) => {
    const payPeriod = req.payPeriod;
  
    if (!payPeriod) {
      res.status(500).json({ message: 'PayPeriod not attached to request.' });
      return;
    }
  
    if (payPeriod.status !== PayPeriodStatus.Open) {
      res.status(403).json({ message: 'Action not allowed on a non-open pay period.' });
      return;
    }
  
    next();
  };
  

// Ensure the pay period is closed for processing
export const ensureClosedPayPeriod = (req: Request, res: Response, next: NextFunction) => {
  const payPeriod = req.payPeriod;

  if (payPeriod.status !== PayPeriodStatus.Closed) {
    res.status(403).json({ message: 'Only closed pay periods can be processed.' });
    return;
  }

  next();
};


// Middleware to validate shifts for a pay period
export const validateShiftsForPayPeriod = async (req: Request, res: Response, next: NextFunction) => {
    const { payPeriodId } = req.params;
  
    const payPeriod = await PayPeriod.findById(payPeriodId);
    if (!payPeriod) {
      res.status(404).json({ message: 'PayPeriod not found.' });
        return;
    }
  
    const invalidShifts = await Shift.find({
      payPeriod: payPeriodId,
      date: { $lt: payPeriod.startDate, $gt: payPeriod.endDate },
    });
  
    if (invalidShifts.length > 0) {
      res.status(400).json({
        message: 'Shifts outside the pay period date range found.',
        invalidShifts,
      });
        return;
    }
  
    next();
  };
  
  // Middleware to validate time entries for shifts
  export const validateTimeEntriesForShifts = async (req: Request, res: Response, next: NextFunction) => {
    const { shiftId } = req.params;
  
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      res.status(404).json({ message: 'Shift not found.' });
        return;
    }
  
    const invalidEntries = await TimeEntry.find({
      shift: shiftId,
      $or: [
        { clockIn: { $lt: shift.date } },
        { clockOut: { $lt: shift.date } },
      ],
    });
  
    if (invalidEntries.length > 0) {
      res.status(400).json({
        message: 'Invalid time entries found for the shift.',
        invalidEntries,
      });
        return;
    }
  
    next();
  };
  
  // Middleware to ensure no modifications to closed or processed pay periods
  export const preventModificationOfClosedPayPeriods = async (req: Request, res: Response, next: NextFunction) => {
    const { payPeriodId } = req.params;
  
    const payPeriod = await PayPeriod.findById(payPeriodId);
    if (!payPeriod) {
      res.status(404).json({ message: 'PayPeriod not found.' });
        return;
    }
  
    if (payPeriod.status === PayPeriodStatus.Processed || payPeriod.status === PayPeriodStatus.Closed) {
      res.status(403).json({ message: 'Modifications to closed or processed pay periods are not allowed.' });
      return;
    }
  
    next();
  };