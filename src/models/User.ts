// src/models/User.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// Enums for Role and Status
export enum UserRole {
  Admin = 'admin',
  Support = 'support',
  User = 'user',
}

export enum UserStatus {
  Pending = 'Pending',
  Active = 'Active',
  Suspended = 'Suspended',
  PendingDeletion = 'Pending Deletion',
  Inactive = 'Inactive',
}

// Address Subdocument Interface with optional fields
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// User Interface extending Document
export interface IUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  applications_managed?: string[]; // Optional
  job_title?: string; // Optional
  employee_id?: string; // Optional
  department?: string; // Optional
  manager?: mongoose.Types.ObjectId | IUser; // Optional
  phone_number?: string; // Optional
  address?: IAddress; // Optional
  profile_picture_url?: string; // Optional
  date_of_birth?: Date; // Optional
  employment_type?: string; // Optional
  onboarding_steps_completed?: string[]; // Optional
  createdBy?: mongoose.Types.ObjectId | IUser; // Optional
  updatedBy?: mongoose.Types.ObjectId | IUser; // Optional
  comparePassword(candidatePassword: string): Promise<boolean>;
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
  { _id: false } // No separate _id for subdocuments
);

// User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true }, // Required at creation
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, // Required at creation
    password_hash: { type: String, required: true }, // Password is hashed
    role: { type: String, enum: Object.values(UserRole), required: true, default: UserRole.User }, // Required with default
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.Pending }, // Set as Pending until verification
    applications_managed: [{ type: String, trim: true }], // Optional
    job_title: { type: String, trim: true }, // Optional
    employee_id: { type: String, unique: true, trim: true }, // Optional - unique ID, can be filled later
    department: { type: String, trim: true }, // Optional
    manager: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional
    phone_number: { type: String, trim: true }, // Optional
    address: { type: AddressSchema }, // Optional
    profile_picture_url: { type: String, trim: true }, // Optional
    date_of_birth: { type: Date }, // Optional
    employment_type: { type: String, trim: true }, // Optional
    onboarding_steps_completed: [{ type: String, trim: true }], // Optional
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional
  },
  { timestamps: true }
);

// Indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ employee_id: 1 });

// Password Hashing Middleware
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Method to Compare Passwords
UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Export the User Model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
