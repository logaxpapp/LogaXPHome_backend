// src/utils/tokenGenerator.ts

import { v4 as uuidv4 } from 'uuid';

export const generateReferenceToken = (): string => {
  return uuidv4();
};
