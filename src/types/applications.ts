// src/types/applications.ts
export const APPLICATIONS = [
    'GatherPlux',
    'BookMiz',
    'BeautyHub',
    'TimeSync',
    'TaskBrick',
    'ProFixer',
    'DocSend',
    'LogaXP',
    'CashVent',
  ] as const;
  
  export type ApplicationType = typeof APPLICATIONS[number]; 
  // "GatherPlux" | "BookMiz" | ... 
  