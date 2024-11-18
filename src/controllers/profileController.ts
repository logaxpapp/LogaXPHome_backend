// src/controllers/profileController.ts
import { Request, Response, NextFunction } from 'express';
import { UserStatus } from '../types/enums';
import {
  getProfile,
  updateProfile,
  updatePassword,
  requestAccountDeletion,
  getEmployees,
  acknowledgePolicy,
} from '../services/userService';
import User from '../models/User';
export const viewProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await getProfile(req.user!);
    res.status(200).json(profile);
  } catch (error: any) {
    next(error); // Passes error to centralized error handler
  }
};

export const editProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updatedUser = await updateProfile(req.user!, req.body);
    
    // Optionally populate references like 'manager' if necessary
    const populatedUser = await User.findById(updatedUser._id).populate('manager');

    res.status(200).json(populatedUser);
  } catch (error: any) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await updatePassword(req.user!, req.body);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    next(error);
  }
};

export const deleteAccountRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      throw { status: 400, message: 'Reason for account deletion is required.' };
    }

    await requestAccountDeletion(req.user!._id, reason);
    res.status(200).json({ message: 'Account deletion requested. Awaiting admin approval.' });
  } catch (error: any) {
    next(error);
  }
};

export const approveDeletionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!._id;

    const user = await User.findById(id);

    if (!user || user.status !== UserStatus.PendingDeletion) {
      throw { status: 400, message: 'No pending deletion request for this user.' };
    }

    user.status = UserStatus.Deleted;
    user.deletionApprovedBy = adminId;
    await user.save();

    res.status(200).json({ message: 'Account deletion approved.' });
  } catch (error: any) {
    next(error);
  }
};

export const rejectDeletionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!._id;

    const user = await User.findById(id);

    if (!user || user.status !== UserStatus.PendingDeletion) {
      throw { status: 400, message: 'No pending deletion request for this user.' };
    }

    user.status = UserStatus.Active;
    user.deletionRejectedBy = adminId;
    user.deletionReason = undefined; // Clear the deletion reason
    await user.save();

    res.status(200).json({ message: 'Account deletion request rejected.' });
  } catch (error: any) {
    next(error);
  }
};

// Handler to Acknowledge a Policy
export const acknowledgePolicyHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resourceId } = req.body;

    if (!resourceId) {
      res.status(400).json({ message: 'Resource ID is required to acknowledge.' });
      return;
    }

    const updatedUser = await acknowledgePolicy(req.user!._id, resourceId);
    res.status(200).json({ message: 'Policy acknowledged successfully.', user: updatedUser });
  } catch (error: any) {
    next(error);
  }
}

