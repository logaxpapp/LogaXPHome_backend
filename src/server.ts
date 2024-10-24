// src/server.ts
import app from './app';
import { connectDB } from './config/database';
import logger from './config/logger';

const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;

// Connect to Database and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to the database', error);
    process.exit(1);
  });
