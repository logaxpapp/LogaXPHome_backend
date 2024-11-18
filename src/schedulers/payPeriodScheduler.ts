// src/schedulers/payPeriodScheduler.ts

import cron from 'node-cron';
import { createPayPeriod } from '../services/payPeriodService';
import mongoose from 'mongoose';
import User from '../models/User';

// Function to determine the next pay period start and end dates
const getNextPayPeriodDates = (): { startDate: Date; endDate: Date } => {
  const today = new Date();
  
  // Example: Bi-weekly pay periods starting on the first Monday of the month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let firstMonday = new Date(firstDayOfMonth);
  
  while (firstMonday.getDay() !== 1) { // 0=Sunday, 1=Monday
    firstMonday.setDate(firstMonday.getDate() + 1);
  }
  
  // Determine the current pay period
  // For simplicity, assuming two-week pay periods
  const weekNumber = Math.ceil(((today.getDate() - firstMonday.getDate()) / 7) + 1);
  const isOdd = weekNumber % 2 !== 0;
  
  let startDate = new Date(firstMonday);
  startDate.setDate(startDate.getDate() + (isOdd ? (weekNumber - 1) * 7 : (weekNumber - 2) * 7));
  
  let endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 13); // 14 days total
    
  return { startDate, endDate };
};

// Scheduler to run every month on the first day at midnight
const schedulePayPeriodCreation = () => {
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running PayPeriod creation scheduler...');
    
    try {
      const { startDate, endDate } = getNextPayPeriodDates();

      // Assuming you have an admin user who creates the pay period
      const adminUser = await User.findOne({ role: 'Admin' });

      if (!adminUser) {
        console.error('Admin user not found. Cannot create pay period.');
        return;
      }

      await createPayPeriod(startDate, endDate, adminUser._id);
      console.log(`PayPeriod created: ${startDate.toDateString()} - ${endDate.toDateString()}`);
    } catch (error) {
      console.error('Error creating PayPeriod:', error);
    }
  }, {
    timezone: 'UTC', // Adjust timezone as needed
  });
};

export default schedulePayPeriodCreation;
