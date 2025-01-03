// src/services/currencyService.ts

import axios from 'axios';
import NodeCache from 'node-cache';

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = 'https://v6.exchangerate-api.com/v6'; // Example for ExchangeRate-API
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

/**
 * Fetch exchange rates from the external API.
 * @param baseCurrency The base currency code.
 * @returns A promise resolving to the exchange rates.
 */
export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number>> => {
  const cacheKey = `exchangeRates_${baseCurrency}`;
  const cachedRates = cache.get(cacheKey);
  if (cachedRates) {
    return cachedRates as Record<string, number>;
  }

  try {
    const response = await axios.get(`${BASE_URL}/${API_KEY}/latest/${baseCurrency}`);
    if (response.data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }
    const rates = response.data.conversion_rates;
    cache.set(cacheKey, rates);
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

/**
 * Convert an amount from one currency to another.
 * @param amount The amount to convert.
 * @param fromCurrency The original currency code.
 * @param toCurrency The target currency code.
 * @returns The converted amount.
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await fetchExchangeRates(fromCurrency);
  const rate = rates[toCurrency];
  if (!rate) {
    throw new Error(`Unsupported currency: ${toCurrency}`);
  }

  return amount * rate;
};
