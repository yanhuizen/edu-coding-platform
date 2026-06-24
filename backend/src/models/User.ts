import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'student' | 'teacher';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  passwordHash: string;
  displayName: string;
  avatarEmoji: string;
  role: UserRole;
  classId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    avatarEmoji: { type: String, default: '🐼' },
    role: { type: String, enum: ['student', 'teacher'], required: true, default: 'student', index: true },
    classId: { type: String },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
