import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserRole } from '../types/enums';
import { sendEmail } from '../utils/email';

export const createContractorHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, phoneNumber, address } = req.body;
  
      // Validate input
      if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email, and password are required.' });
        return;
      }
  
      // Check if a user with the same email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'A user with this email already exists.' });
        return;
      }
  
      // Hash the provided password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Validate and use the structured address
      if (typeof address !== 'object' || !address.street || !address.city || !address.state || !address.country) {
        res.status(400).json({ message: 'Invalid address format.' });
        return;
      }
  
      // Create a new contractor user
      const contractor = new User({
        name,
        email,
        password_hash: hashedPassword,
        role: UserRole.Contractor, // Assign contractor role
        phone_number: phoneNumber,
        address, // Save the structured address
        employee_id: `CON-${Date.now()}`, 
      });
  
      await contractor.save();
  
      // Send a welcome email to the contractor
      const emailBody = `
        Dear ${name},
  
        Welcome to our platform! You have been registered as a contractor. Please use the following credentials to log in:
        - Email: ${email}
        - Password: (the password you provided during registration)
  
        You can log in here: [Insert Login URL]
  
        Best regards,
        [Your Company Name]
      `;
  
      await sendEmail({
        to: email,
        subject: 'Welcome to Our Contractor Platform!',
        text: emailBody,
      });
  
      res.status(201).json({
        message: 'Contractor created successfully, and a welcome email has been sent.',
        contractor,
      });
    } catch (error) {
      console.error('Error creating contractor:', error);
      res.status(500).json({ message: 'Failed to create contractor.' });
    }
  };
  