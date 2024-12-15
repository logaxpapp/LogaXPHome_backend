// src/server.ts

import {  server } from './app';
import { connectDB } from './config/database';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

// Connect to Database and Start Server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to the database', error);
    process.exit(1);
  });
