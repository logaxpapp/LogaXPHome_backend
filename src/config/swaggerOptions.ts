// src/config/swaggerOptions.ts
import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Service Desk API',
      version: '1.0.0',
      description: 'API documentation for the Service Desk application.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Paths to files with documentation comments
};

export default swaggerOptions;
