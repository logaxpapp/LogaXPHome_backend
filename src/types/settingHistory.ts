// src/types/settingHistory.ts

export interface ISettingHistory {
    _id: string;
    key: string;
    value: string;
    version: number;
    modifiedAt: string;
    modifiedBy: string;
  }
  