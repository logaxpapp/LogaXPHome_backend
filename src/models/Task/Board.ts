import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from '../User';
import { IList } from './List';
import { ITeam } from '../Team';

export interface IBoard extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId | IUser;
  team: mongoose.Types.ObjectId | ITeam;
  members: mongoose.Types.ObjectId[];
  lists: mongoose.Types.ObjectId[] | IList[];
  labels: mongoose.Types.ObjectId[];
  headers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBoardPopulated extends Omit<IBoard, 'members'> {
    // Here, members is a populated array of IUser
    members: IUser[];
}

const BoardSchema: Schema<IBoard> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lists: [{ type: Schema.Types.ObjectId, ref: 'List' }],
    labels: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
    headers: [{ type: String }],
  },
  { timestamps: true }
);

// Optional text index for searching
BoardSchema.index({ name: 'text', description: 'text' });

// Pre-deleteOne hook for cascading deletes
BoardSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    // `this` refers to the document being deleted
    const board = this as IBoard;

    // Remove all lists associated with the board
    await mongoose.model('List').deleteMany({ board: board._id });

    // Optionally, remove cards and labels
    // await mongoose.model('Card').deleteMany({ board: board._id });
    // await mongoose.model('Label').deleteMany({ board: board._id });

    next();
  } catch (error) {
    next(error as mongoose.CallbackError);
  }
});

const Board: Model<IBoard> = mongoose.model<IBoard>('Board', BoardSchema);
export default Board;
