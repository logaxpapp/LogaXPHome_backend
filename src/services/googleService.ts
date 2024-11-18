// src/services/GoogleService.ts
import { google, calendar_v3 } from 'googleapis';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

// Generate Auth URL with state (userId)
export const getAuthUrl = (userId: string): string => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: userId, // Include user ID in state
  });
};

// Exchange code for tokens
export const getTokens = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

// Refresh Access Token
export const refreshAccessToken = async (userId: string): Promise<string> => {
  const user = await User.findById(userId);

  if (!user?.googleRefreshToken) {
    throw new Error('No refresh token available');
  }

  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  user.googleAccessToken = credentials.access_token || ''; // Default to empty string
  user.googleTokenExpiry = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 3600 * 1000); // Default to 1 hour if expiry_date is undefined

  await user.save();

  return user.googleAccessToken;
};

// Create Google Calendar Event
export const createGoogleCalendarEvent = async (eventDetails: {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
}) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event: calendar_v3.Schema$Event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: eventDetails.start,
    end: eventDetails.end,
    attendees: eventDetails.attendees,
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
  } as calendar_v3.Params$Resource$Events$Insert);

  return {
    eventLink: response.data?.htmlLink,
    meetLink: response.data?.conferenceData?.entryPoints?.[0]?.uri,
  };
};

// List Google Calendar Events
export const getGoogleCalendarEvents = async () => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
};

// Delete Google Calendar Event
export const deleteGoogleCalendarEvent = async (eventId: string) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
};
