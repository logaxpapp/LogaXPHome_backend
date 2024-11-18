// src/types/express.d.ts
import { PayPeriod } from '../models/PayPeriod';

declare global {
  namespace Express {
    interface Request {
      payPeriod?: PayPeriod;
    }
  }
}
