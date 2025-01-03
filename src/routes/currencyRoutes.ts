// src/routes/currencyRoutes.ts

import express from 'express';
import { getExchangeRates, postConvertCurrency } from '../controllers/currencyController';
import { authenticateJWT } from '../middlewares/authMiddleware'; // If authentication is required

const router = express.Router();

// Apply authentication middleware if necessary
router.use(authenticateJWT);

// Route to get exchange rates
router.get('/rates', getExchangeRates);

// Route to convert currency
router.post('/convert', postConvertCurrency);

export default router;
