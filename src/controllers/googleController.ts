// src/controllers/GoogleController.ts
import { Request, Response, NextFunction } from 'express';
import * as GoogleService from '../services/googleService';
import User from '../models/User';

// Initiate Google OAuth
export const initiateGoogleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.body.userId; // Ensure userId is sent from the frontend
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }
    const authUrl = GoogleService.getAuthUrl(userId);
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error initiating Google Auth:', error);
    res.status(500).json({ message: 'Failed to initiate Google authentication' });
  }
};

// Handle OAuth Callback
export const handleGoogleAuthCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string; // Extract userId from state
    if (!state) {
      res.status(400).json({ message: 'State parameter is missing' });
      return;
    }

    const tokens = await GoogleService.getTokens(code);

    const googleAccessToken = tokens.access_token || '';
    const googleRefreshToken = tokens.refresh_token || '';
    const googleTokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default to 1 hour if expiry_date is undefined

    const user = await User.findByIdAndUpdate(
      state, // Use userId from state
      {
        googleAccessToken,
        googleRefreshToken,
        googleTokenExpiry,
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.redirect('http://localhost:5173/dashboard/shift-calendar');
  } catch (error) {
    console.error('Error in Google Auth Callback:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Create Google Calendar Event
export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventDetails = req.body;
    const event = await GoogleService.createGoogleCalendarEvent(eventDetails);
    res.json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

// List Google Calendar Events
export const listEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await GoogleService.getGoogleCalendarEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// Delete Google Calendar Event
export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.eventId;
    await GoogleService.deleteGoogleCalendarEvent(eventId);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

// Disconnect Google Account
export const disconnectGoogleAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      res.status(400).json({ message: 'User email is required' });
      return;
    }
    await User.findOneAndUpdate(
      { email: userEmail },
      {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
      }
    );
    res.status(200).json({ message: 'Google account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    res.status(500).json({ message: 'Failed to disconnect Google account' });
  }
};
