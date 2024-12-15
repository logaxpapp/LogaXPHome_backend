// src/services/hrIntegrationService.ts

import axios from 'axios';
import { IUser } from '../models/User';
import mongoose from'mongoose';

/**
 * Fetch employees from HR system and sync with local database.
 */
export const syncEmployeesWithHR = async () => {
  try {
    const response = await axios.get('https://api.hrsystem.com/employees', {
      headers: {
        Authorization: `Bearer ${process.env.HR_API_TOKEN}`,
      },
    });

    const employees = response.data;

    for (const emp of employees) {
      await mongoose.model('User').findOneAndUpdate(
        { email: emp.email },
        {
          name: emp.name,
          // Update other fields as necessary
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).exec();
    }

    console.log('Employees synced successfully.');
  } catch (error) {
    console.error('Error syncing employees with HR:', error);
  }
};
