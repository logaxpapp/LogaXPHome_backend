import { Request, Response, NextFunction } from 'express';

export const validateCreateGroup = (req: Request, res: Response, next: NextFunction) => {
  const { name, members } = req.body;

  // Validate the group name
  if (!name || typeof name !== 'string') {
    res.status(400).json({ message: 'Group name is required and must be a string' });
    return;
  }

  // Optional: Enforce minimum/maximum length for the name
  if (name.length < 3 || name.length > 50) {
    res
      .status(400)
      .json({ message: 'Group name must be between 3 and 50 characters long' });
    return;
  }

  // Validate the members array (optional)
  if (members) {
    if (!Array.isArray(members)) {
      res.status(400).json({ message: 'Members must be an array of user IDs' });
      return;
    }

    if (members.some((id) => typeof id !== 'string')) {
      res
        .status(400)
        .json({ message: 'Each member ID in the members array must be a string' });
      return;
    }
  }

  next();
};
