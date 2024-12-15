// src/validators/changeRequestValidators.ts

import { body } from 'express-validator';

export const createChangeRequestValidators = [
  body('fields_to_change').custom((value) => {
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('fields_to_change must be an object.');
    }

    const allowedFields = [
      'name', // Full Name
      'email', // Email Address
      'phone_number', // Phone Number
      'address', // Address
      'profile_picture_url', // Profile Picture URL
      'date_of_birth', // Date of Birth
      'employment_type', // Employment Type
      'hourlyRate', // Hourly Rate
      'overtimeRate', // Overtime Rate
      'job_title', // Job Title
      'department', // Department
    ];

    const keys = Object.keys(value);

    if (keys.length === 0) {
      throw new Error('At least one field must be specified for change.');
    }

    for (const key of keys) {
      if (!allowedFields.includes(key)) {
        throw new Error(`Field '${key}' cannot be changed via Change Request.`);
      }
    }

    return true;
  }),
];

