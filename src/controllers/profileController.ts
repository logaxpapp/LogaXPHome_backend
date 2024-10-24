// src/controllers/profileController.ts
import { Request, Response } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  requestAccountDeletion,
} from '../services/userService';

export const viewProfile = async (req: Request, res: Response) => {
  try {
    const profile = await getProfile(req.user!);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const editProfile = async (req: Request, res: Response) => {
  try {
    await updateProfile(req.user!, req.body);
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    await updatePassword(req.user!, req.body);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const deleteAccountRequest = async (req: Request, res: Response) => {
  try {
    await requestAccountDeletion(req.user!);
    res.status(200).json({ message: 'Account deletion requested. Awaiting admin approval.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};
