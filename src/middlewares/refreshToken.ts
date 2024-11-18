// src/middleware/refreshToken.ts

import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';

export const refreshTokenMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string, { ignoreExpiration: true }) as any;

    // Check if the token is close to expiring (e.g., less than 5 minutes remaining)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp - currentTime < 300) { // 5 minutes before expiration
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '2h' } // Renew for another 2 hours
      );

      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
      });
    }
  } catch (error) {
    // Type casting error as Error to access message property
    if (error instanceof Error) {
      console.error("Token refresh error:", error.message);
    } else {
      console.error("Unknown error occurred during token refresh.");
    }
  }
  next();
};
