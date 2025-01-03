// src/types/task.ts

export interface IBoard {
    _id: string;
    name: string;
    description?: string;
    owner: string; // User ID
    members: string[]; // Array of User IDs
    lists: IList[]; // Populated List data
    labels: string[]; // Array of Label IDs
    createdAt: string;
    updatedAt: string;
  }
  
  export interface IList {
    _id: string;
    name: string;
    board: string; // Board ID
    position: number;
    cards: ICard[]; // Populated Card data
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ICard {
    _id: string;
    title: string;
    description?: string;
    boardId: string; // Board ID
    list: string; // List ID
    assignees: string[]; // Array of User IDs
    labels: string[]; // Array of Label IDs
    dueDate?: string;
    attachments: string[]; // Array of Attachment IDs
    comments: string[]; // Array of Comment IDs
    position: number;
    createdAt: string;
    updatedAt: string;
  }
  
  // Populated interfaces without extending
  export interface IListPopulated {
    _id: string;
    name: string;
    board: IBoard;
    position: number;
    cards: ICard[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ICardPopulated {
    _id: string;
    title: string;
    description?: string;
    list: IListPopulated;
    assignees: string[];
    labels: string[];
    dueDate?: string;
    attachments: string[];
    comments: string[];
    position: number;
    createdAt: string;
    updatedAt: string;
  }
  

export interface ICustomFieldInput {
    key: string;
    value: string;
  }
  
  export interface ICustomField extends ICustomFieldInput {
    id: string;
  }
  