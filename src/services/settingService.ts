// src/services/settingService.ts

import Setting, { ISetting } from '../models/Setting';
import SettingHistory from '../models/SettingHistory';

export const getAllSettings = async (): Promise<ISetting[]> => {
  return Setting.find().lean();
};

export const updateSetting = async (
  key: string,
  value: string,
  modifiedBy: string
): Promise<ISetting | null> => {
  const currentSetting = await Setting.findOne({ key });

  let version = 1;
  if (currentSetting) {
    // Save current version to history
    await SettingHistory.create({
      key: currentSetting.key,
      value: currentSetting.value,
      version: currentSetting.version,
      modifiedAt: new Date(),
      modifiedBy,
    });
    version = currentSetting.version + 1;
  }

  const updatedSetting = await Setting.findOneAndUpdate(
    { key },
    { value, version },
    { new: true, upsert: true }
  );

  return updatedSetting ? (updatedSetting.toObject() as ISetting) : null;
};

export const deleteSetting = async (key: string): Promise<void> => {
  await Setting.deleteOne({ key });
};

export const revertSetting = async (
  key: string,
  version: number,
  modifiedBy: string
): Promise<ISetting | null> => {
  // Find the historical version
  const historyRecord = await SettingHistory.findOne({ key, version });
  if (!historyRecord) {
    throw new Error(`Version ${version} of setting "${key}" not found.`);
  }

  // Save current version to history
  const currentSetting = await Setting.findOne({ key });
  if (currentSetting) {
    await SettingHistory.create({
      key: currentSetting.key,
      value: currentSetting.value,
      version: currentSetting.version,
      modifiedAt: new Date(),
      modifiedBy,
    });
  }

  // Update setting to historical version
  const updatedSetting = await Setting.findOneAndUpdate(
    { key },
    { value: historyRecord.value, version: historyRecord.version },
    { new: true }
  );

  return updatedSetting ? (updatedSetting.toObject() as ISetting) : null;
};
