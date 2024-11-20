import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerOptions from './config/swaggerOptions';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import { scheduleDailyTasks } from './utils/scheduler';
import schedulePayPeriodCreation from './schedulers/payPeriodScheduler';
import { seedSettings } from './utils/seedSettings';

dotenv.config();

const app: Application = express();

// Trust Proxy for Reverse Proxy Environments (e.g., Render)
app.set('trust proxy', 1); // Required for X-Forwarded-For and CSRF protection

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',') // Allow multiple origins from env (comma-separated)
      : ['https://logaxp-home.onrender.com', 'http://localhost:5173'], // Fallback to these origins
    credentials: true, // Allow cookies to be sent
  })
);
app.use(mongoSanitize());
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Parse cookies

// HTTP Request Logging
app.use(morgan('combined'));

// CSRF Protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies only in production
    sameSite: 'strict', // Prevent CSRF attacks by ensuring same-site requests
  },
});

// Apply CSRF protection to all POST, PUT, DELETE routes under /api
app.use('/api', csrfProtection);

// Swagger Documentation
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', routes); // Centralized route mounting

// CSRF Token Endpoint
app.get('/api/csrf-token', (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Seed Initial Settings (Uncomment if needed)
// seedSettings().catch((error) => {
//   console.error('Error seeding settings:', error);
// });

// Start Schedulers
scheduleDailyTasks();
schedulePayPeriodCreation();

// Error Handling Middleware
app.use(errorHandler);

export default app;
