import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  lastAccessed: Date;
}

const SessionSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    lastAccessed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Session: Model<ISession> = mongoose.model<ISession>('Session', SessionSchema);
export default Session;
