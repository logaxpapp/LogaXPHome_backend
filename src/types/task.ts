// src/types/task.ts

import { IUser } from '../models/User';

/**
 * SubTask, TimeLog, and CustomField interfaces
 * to attach to ICard.
 */
export interface ISubTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;    // ISO date string
  assignee?: string;   // userId as string
}

export interface ITimeLog {
  id: string;
  user: string;       // userId as string
  start: string;      // ISO date string
  end?: string;       // ISO date string
  duration?: number;  // e.g., total minutes or hours
}

export interface ICustomFieldInput {
  key: string;
  value: string;
}

export interface ICustomField extends ICustomFieldInput {
  id: string;
}

/**
 * Base Card interface
 */
export interface IBaseCard {
  _id: string;
  title: string;
  description?: string;
  boardId: string;      // Board ID as string
  list: string;        // List ID as string
  assignees: string[]; // Array of User IDs as strings
  labels: string[];    // Array of Label IDs as strings
  dueDate?: string;    // ISO date string
  attachments: string[]; // Array of Attachment IDs as strings
  comments: string[];    // Array of Comment IDs as strings
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Card interface (EXTENDED to have subTasks, timeLogs, customFields)
 */
export interface ICard extends IBaseCard {
  subTasks?: ISubTask[];
  timeLogs?: ITimeLog[];
  customFields?: ICustomField[];
}

/**
 * Board interface
 */
export interface IBoard {
  _id: string;
  name: string;
  description?: string;
  owner: string;        // User ID
  members: string[];    // Array of User IDs
  lists: IList[];       // Populated List data
  labels: string[];     // Array of Label IDs
  createdAt: string;
  updatedAt: string;
}

/**
 * List interface
 */
export interface IList {
  _id: string;
  name: string;
  board: string;        // Board ID as string
  position: number;
  cards: string[];      // Array of Card IDs as strings
  createdAt: string;
  updatedAt: string;
}

/**
 * Populated List interface
 */
export interface IListPopulated {
  _id: string;
  name: string;
  board: IBoard;        // Fully populated Board
  position: number;
  cards: ICard[];       // Populated Card data
  createdAt: string;
  updatedAt: string;
}

/**
 * Label interface
 */
export interface ILabel {
  _id: string;
  name: string;
  color: string;
  boardId: string;      // Board ID as string
  createdAt: string;
  updatedAt: string;
}

/**
 * Attachment interface
 */
export interface IAttachment {
  _id: string;
  card: string;         // Card ID as string
  uploader: string;     // User ID as string
  filename: string;
  url: string;
  uploadedAt: string;
}

/**
 * Comment interface
 */
export interface IComment {
  _id: string;
  card: string;         // Card ID as string
  author: IUser;        // Populated User object
  content: string;
  likes: string[];      // User IDs who liked the comment
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
}

/**
 * Activity interface
 */
export interface IActivity {
  _id: string;
  board?: string;       // Board ID as string
  list?: string;        // List ID as string
  card?: string;        // Card ID as string
  user: IUser;          // Populated User object
  type: string;         // ActivityType
  details: string;
  createdAt: string;
}

/**
 * For updating lists
 */
export interface IUpdateListInput {
  _id: string;
  cards?: string[];     // Array of Card IDs as strings
  name?: string;
  // Include other updatable fields if necessary
}

/**
 * For updating board-lists order
 */
export interface IUpdateBoardListsInput {
  _id: string;
  lists: string[];     // Array of List IDs in the desired order
}

/**
 * Define ICreateCardInput
 */


export interface ICreateCardInput {
  title: string;
  description?: string;
  list: string; // List ID
  assignees?: string[]; // User IDs
  labels?: string[]; // Label IDs
  dueDate?: string;
  position?: number;
  status?: string; // New Field
  priority?: string; // New Field
  startDate?: string; // New Field
  dependencies?: string[]; // New Field for Dependencies
}


/**
 * Populated Card interface
 */
export interface IPopulatedCard extends Omit<IBaseCard, 'list' | 'assignees' | 'labels' | 'attachments' | 'comments'> {
  list: IListPopulated;               // Fully populated IList
  assignees: IUser[];                 // Populated User objects
  labels: ILabel[];                   // Populated Label objects
  attachments: IAttachment[];         // Populated Attachment objects
  comments: IComment[];               // Populated Comment objects
  subTasks?: ISubTask[];
  timeLogs?: ITimeLog[];
  customFields?: ICustomField[];
  progress: number;    
  likes: string[]; // User IDs who liked the card
  status: string; // e.g., "To Do", "In Progress", "Done"
  priority: string; // e.g., "Low", "Medium", "High"
  startDate?: string; // ISO date string
  dependencies?: string[]; // New Field for Dependencies
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: IUser; // Populated User object
  watchers: IUser[]; // Populated User objects
              
}


/**
 * Label interface for API responses
 */
export interface ILabelResponse {
  _id: string;
  name: string;
  color: string;
  boardId: string; // Reference to the board as a string
  createdAt: string; // ISO string representation
  updatedAt: string; // ISO string representation
}