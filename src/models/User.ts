// src/models/User.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole, UserStatus, Application, OnboardingStep, OnlineStatus } from '../types/enums';
import Session from './Session';
import Team, { ITeam } from './Team';

// Address Subdocument Interface
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// Password history interface
interface IPasswordHistory {
  hash: string;
  changedAt: Date;
}

// User Interface extending Document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password_hash: string;
  passwordHistory: IPasswordHistory[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordReused(newPassword: string): Promise<boolean>;
  role: UserRole;
  teamsManaged?: mongoose.Types.ObjectId[];
  teams?: mongoose.Types.ObjectId[]; 
  status: UserStatus;
  applications_managed?: Application[];
  job_title?: string;
  employee_id?: string;
  department?: string;
  manager?: mongoose.Types.ObjectId | IUser;
  phone_number?: string;
  address?: IAddress;
  profile_picture_url?: string;
  date_of_birth?: Date;
  employment_type?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  onboarding_steps_completed?: OnboardingStep[]; // Updated to use OnboardingStep enum
  createdBy?: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId | IUser;
  token?: string;
  googleConnected?: boolean;
  expiresIn?: string;
  deletionReason?: string;
  deletionApprovedBy?: mongoose.Types.ObjectId | IUser;
  deletionRejectedBy?: mongoose.Types.ObjectId | IUser;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  passwordExpiryNotified?: boolean;
  acknowledgedPolicies?: mongoose.Types.ObjectId[];
  onlineStatus: OnlineStatus;
  recordLogin(): Promise<void>;
  recordLogout(): Promise<void>;
  [key: string]: any
}

// Address Subdocument Schema
const AddressSchema: Schema<IAddress> = new Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

// OnboardingStep Enum Array
const OnboardingStepsEnum = Object.values(OnboardingStep);

// User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    passwordHistory: [
      {
        hash: { type: String, required: true },
        changedAt: { type: Date, required: true },
      },
    ],
    role: { type: String, enum: Object.values(UserRole), required: true, default: UserRole.User },
    teamsManaged: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.Pending },
    onlineStatus: { type: String, enum: Object.values(OnlineStatus), default: OnlineStatus.Offline },
    applications_managed: [{ type: String, enum: Object.values(Application), trim: true }],
    deletionReason: { type: String, trim: true },
    deletionApprovedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletionRejectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    job_title: { type: String, trim: true },
    employee_id: { type: String, unique: true, trim: true },
    department: { type: String, trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    phone_number: { type: String, trim: true },
    address: { type: AddressSchema },
    profile_picture_url: { type: String, trim: true },
    date_of_birth: { type: Date },
    employment_type: { type: String, trim: true },
    hourlyRate: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 1.5 },
    onboarding_steps_completed: [{type: String, enum: OnboardingStepsEnum, trim: true,},],
    googleConnected: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
    googleTokenExpiry: { type: Date },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    passwordExpiryNotified: { type: Boolean, default: false },
    acknowledgedPolicies: [{ type: Schema.Types.ObjectId, ref: 'Resource' }],
  },
  { timestamps: true }
);

// Method to check if the password is reused
UserSchema.methods.isPasswordReused = async function (newPassword: string): Promise<boolean> {
  for (const entry of this.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, entry.hash);
    if (isMatch) return true;
  }
  return false;
};

// Password hashing middleware
UserSchema.pre<IUser>('save', async function (next) {
  // If the password field isn't modified, skip the middleware
  if (!this.isModified('password_hash')) return next();

  try {
    // If not a new document, save the current hashed password to history
    if (!this.isNew) {
      // Fetch the current hashed password from the database
      const user = await User.findById(this._id).select('password_hash');
      if (user && user.password_hash) {
        this.passwordHistory.push({
          hash: user.password_hash, // Save the current hashed password
          changedAt: new Date(),
        });

        // Keep only the last 5 passwords
        if (this.passwordHistory.length > 5) {
          this.passwordHistory.shift();
        }
      }
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);

    // Update the passwordChangedAt field
    this.passwordChangedAt = new Date();

    // Reset the passwordExpiryNotified flag
    this.passwordExpiryNotified = false;

    next();
  } catch (error) {
    next(error as mongoose.CallbackError);
  }
});

// Method to Compare Passwords
UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  if (!this.password_hash) {
    throw new Error('Password hash is missing.');
  }
  return bcrypt.compare(candidatePassword, this.password_hash);
};
// Method to Record Login
UserSchema.methods.recordLogin = async function () {
  this.lastLoginAt = new Date();
  await this.save();

  // Update or create an active session
  await Session.findOneAndUpdate(
    { userId: this._id },
    { userId: this._id, isActive: true, lastAccessed: new Date() },
    { upsert: true }
  );
};

// Method to Record Logout
UserSchema.methods.recordLogout = async function () {
  await Session.findOneAndUpdate(
    { userId: this._id, isActive: true },
    { isActive: false }
  );
};

// Export the User Model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
