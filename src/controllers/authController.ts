// src/controllers/authController.ts
import { Request, Response } from 'express';
import {
  registerUser,
  verifyEmail,
  loginUser,
} from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const message = await registerUser(req.body);
    res.status(201).json({ message });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const verifyEmailHandler = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const message = await verifyEmail(token);
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || 'Invalid or expired token' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const token = await loginUser(req.body);
    res.status(200).json({ token });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || 'Invalid credentials' });
  }
};
