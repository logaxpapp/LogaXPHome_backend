// src/types/globals.d.ts
declare module 'xss-clean' {
    import { RequestHandler } from 'express';
  
    const xssClean: RequestHandler;
    export default xssClean;
  }
  