import { Request, Response, NextFunction } from 'express';
import { validationResult, body, } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation error', errors: errors.array() });
  } else {
    next();
  }
};

export const handleValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};


export const validateEmploymentReference = [
  body('from').isISO8601().withMessage('From date must be a valid date'),
  body('to').isISO8601().withMessage('To date must be a valid date'),
  body('position').notEmpty().withMessage('Position is required'),
  body('reasonForLeaving').notEmpty().withMessage('Reason for leaving is required'),
  body('salary').notEmpty().withMessage('Salary is required'),
  body('name').notEmpty().withMessage('Your name is required'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('companyAddress').notEmpty().withMessage('Company address is required'),
];
