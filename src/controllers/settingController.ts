// src/controllers/settingController.ts

import { Request, Response } from 'express';
import {
  getAllSettings,
  updateSetting,
  deleteSetting,
  revertSetting,
} from '../services/settingService';
import SettingHistory from '../models/SettingHistory';

export const getAllSettingsHandler = async (req: Request, res: Response) => {
  try {
    const settings = await getAllSettings();
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching settings' });
  }
};

export const updateSettingHandler = async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    const modifiedBy = req.user?.email || 'system'; // Ensure modifiedBy is provided
    const setting = await updateSetting(key, value, modifiedBy);
    res.status(200).json({ message: 'Setting updated successfully', setting });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error updating setting' });
  }
};

export const deleteSettingHandler = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    await deleteSetting(key);
    res.status(200).json({ message: 'Setting deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting setting' });
  }
};

export const getSettingHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const history = await SettingHistory.find({ key }).sort({ version: -1 }).lean();
    res.status(200).json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching setting history' });
  }
};

export const revertSettingHandler = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { version } = req.body;
    const modifiedBy = req.user?.email || 'system';
    const setting = await revertSetting(key, version, modifiedBy);
    res.status(200).json({ message: 'Setting reverted successfully', setting });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error reverting setting' });
  }
};
