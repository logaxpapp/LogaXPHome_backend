// src/controllers/currencyController.ts

import { Request, Response } from 'express';
import { fetchExchangeRates, convertCurrency } from '../services/currencyService';

/**
 * Get exchange rates for a base currency.
 */
export const getExchangeRates = async (req: Request, res: Response) => {
  const baseCurrency = (req.query.base as string) || 'USD';

  try {
    const rates = await fetchExchangeRates(baseCurrency);
    res.status(200).json({ base: baseCurrency, rates });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rates.' });
  }
};

/**
 * Convert amount from one currency to another.
 */
export const postConvertCurrency = async (req: Request, res: Response) => {
  const { amount, fromCurrency, toCurrency } = req.body;

  // Validate required fields
  if (
    typeof amount !== 'number' ||
    !fromCurrency ||
    typeof fromCurrency !== 'string' ||
    !toCurrency ||
    typeof toCurrency !== 'string'
  ) {
    res.status(400).json({ message: 'Missing required fields.' });
    return;
  }

  try {
    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
    res.status(200).json({ amount: convertedAmount, currency: toCurrency });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ message: 'Failed to convert currency.' });
  }
};
