// src/types/json2csv.d.ts
declare module 'json2csv' {
    import { Transform } from 'stream';
  
    export class Parser {
      constructor(opts?: any);
      parse(data: any[]): string;
    }
  
    export class Transform extends Transform {}
  }
  