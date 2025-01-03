// src/models/List.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { ICard } from './Card';
import { IBoard } from './Board'; // Import IBoard

export interface IList extends Document {
  name: string;
  board: mongoose.Types.ObjectId | IBoard; // Reference to Board
  position: number;
  header: string
  cards: mongoose.Types.ObjectId[]; // Populated as ICard[]
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema: Schema<IList> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    position: { type: Number, default: 0 },
    header: { type: String, required: true },
    cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
  },
  { timestamps: true }
);

const List: Model<IList> = mongoose.model<IList>('List', ListSchema);
export default List;
