import mongoose, { Document, Schema, Model, Types } from 'mongoose';

/**
 * The Referee model stores the user’s claimed details about a referee,
 * including the user’s signature affirming the information is correct.
 */
export interface IReferee extends Document {
  user: Types.ObjectId;          // The user (applicant) who created this referee
  name: string;
  email: string;
  companyName: string;
  relationship: string;
  startDate: Date;               // Renamed from "dateStarted" for consistency
  endDate: Date;                 // Renamed from "dateEnded" for consistency
  reasonForLeaving: string;
  address: string;
  positionHeld: string;          // Referee's position
  userPositionHeld: string;      // The user's (applicant's) position, if relevant
  userSignature: string;         // The applicant's signature affirming the data
}

const RefereeSchema: Schema<IReferee> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reasonForLeaving: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    positionHeld: { type: String, required: true, trim: true },   // Referee's role
    userPositionHeld: { type: String, required: true, trim: true }, // Applicant's role
    userSignature: { type: String, required: true },  // Base64 or URL
  },
  { timestamps: true }
);

// Optional unique index for (user + email) if you only want one entry per user/referee email
RefereeSchema.index({ user: 1, email: 1 }, { unique: true });

const Referee: Model<IReferee> = mongoose.model<IReferee>('Referee', RefereeSchema);
export default Referee;
