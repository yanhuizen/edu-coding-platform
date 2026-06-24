import { Schema, model, Document, Types } from 'mongoose';

export type SubmissionStatus = 'pending' | 'passed' | 'failed' | 'graded';

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  code: string;
  output: string;
  status: SubmissionStatus;
  score?: number;
  teacherComment?: string;
  submittedAt: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    code: { type: String, default: '' },
    output: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'graded'],
      default: 'pending',
      index: true,
    },
    score: { type: Number },
    teacherComment: { type: String },
    submittedAt: { type: Date, default: () => new Date() },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

SubmissionSchema.index({ studentId: 1, assignmentId: 1, submittedAt: -1 });

export const Submission = model<ISubmission>('Submission', SubmissionSchema);
