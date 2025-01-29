import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

/**
 * Describes a single stroke on the whiteboard.
 * We include text, fontSize, and fontFamily as optional fields.
 */
export interface IStroke {
  type: string; // e.g. 'line', 'rectangle', 'eraser', 'text'
  color: string;
  lineWidth: number;
  points: { x: number; y: number }[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * A Snapshot that stores the entire whiteboard content at a given time.
 */
export interface IWhiteboardSnapshot {
  _id?: mongoose.Types.ObjectId;
  createdAt: Date;
  content: IStroke[];
  version: number;
}

/**
 * Main Whiteboard Document interface (Mongoose)
 */
export interface IWhiteboard extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  owner: mongoose.Types.ObjectId | IUser;
  participants: Array<mongoose.Types.ObjectId | IUser>;
  strokes: IStroke[];
  snapshots: IWhiteboardSnapshot[];
  version: number; // increments if strokes changed
  createdAt: Date;
  updatedAt: Date;
}

// ------------------- STROKE SCHEMA -------------------
const StrokeSchema = new Schema<IStroke>(
  {
    type: { type: String, required: true },
    color: { type: String, default: '#000' },
    lineWidth: { type: Number, default: 2 },
    text: { type: String },
    fontSize: { type: Number },
    fontFamily: { type: String },
    points: [
      {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
      },
    ],
  },
  { _id: false } // no separate _id for each stroke
);

// ------------------- SNAPSHOT SCHEMA -------------------
const WhiteboardSnapshotSchema = new Schema<IWhiteboardSnapshot>(
  {
    createdAt: { type: Date, default: Date.now },
    content: { type: [StrokeSchema], default: [] },
    version: { type: Number, required: true },
  },
  { _id: true }
);

// ------------------- MAIN WHITEBOARD SCHEMA -------------------
const WhiteboardSchema = new Schema<IWhiteboard>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },

    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    strokes: { type: [StrokeSchema], default: [] },
    snapshots: { type: [WhiteboardSnapshotSchema], default: [] },

    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/**
 * Pre-save hook to increment `version` if `strokes` changed.
 */
WhiteboardSchema.pre<IWhiteboard>('save', function (next) {
  if (this.isModified('strokes')) {
    this.version += 1;
  }
  next();
});

const Whiteboard: Model<IWhiteboard> = mongoose.model<IWhiteboard>(
  'Whiteboard',
  WhiteboardSchema
);

export default Whiteboard;
