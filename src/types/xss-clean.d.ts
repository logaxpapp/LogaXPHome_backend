// src\types\xss-clean.d.ts

declare module 'xss-clean' {
    import { RequestHandler } from 'express';
    
    /**
     * Middleware to sanitize user input and prevent XSS attacks.
     * @returns {RequestHandler}
     */
    function xssClean(): RequestHandler;
    
    export default xssClean;
  }
  