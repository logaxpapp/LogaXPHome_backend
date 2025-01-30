// src/app.ts

import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
// import { scheduleDailyTasks } from './utils/scheduler';
import schedulePayPeriodCreation from './schedulers/payPeriodScheduler';
import { initializeSocket } from './utils/socketHandler'; 
import publicIndex  from './routes/publicIndex';


dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['https://logaxp.com', 'http://localhost:5173'],
    credentials: true,
  },
});

// Initialize Socket.IO logic
initializeSocket(io);

// Trust Proxy for Reverse Proxy Environments
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['https://logaxp.com', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(mongoSanitize());
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// HTTP Request Logging
app.use(morgan('combined'));

// Public Routes
//pp.use( '/api', publicIndex);

// CSRF Protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// Apply CSRF protection to all POST, PUT, DELETE routes under /api
app.use('/api', csrfProtection);

// Routes
app.use('/api', routes);

// CSRF Token Endpoint
app.get('/api/csrf-token', (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Start Schedulers
//scheduleDailyTasks();
schedulePayPeriodCreation();

// Error Handling Middleware
app.use(errorHandler);

export { app, server, io };