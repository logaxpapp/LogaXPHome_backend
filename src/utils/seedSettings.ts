// src/utils/seedSettings.ts

import Setting from '../models/Setting';

export const seedSettings = async () => {
  const defaultSettings = [
    { key: 'site_title', value: 'My Website' },
    { key: 'admin_email', value: 'admin@example.com' },
    // Add more default settings
  ];

  for (const setting of defaultSettings) {
    await Setting.updateOne(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true }
    );
  }
};
