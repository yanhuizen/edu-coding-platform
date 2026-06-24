import { Schema, model, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  title: string;
  prompt: string;
  starterCode: string;
  expectedOutput?: string;
  totalScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true, trim: true },
    prompt: { type: String, default: '' },
    starterCode: { type: String, default: '' },
    expectedOutput: { type: String },
    totalScore: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export const Assignment = model<IAssignment>('Assignment', AssignmentSchema);
