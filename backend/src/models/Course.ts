import { Schema, model, Document, Types } from 'mongoose';

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  contentMd: string;
  codeExample: string;
  order: number;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  coverEmoji: string;
  order: number;
  lessons: ILesson[];
  createdBy: Types.ObjectId;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    contentMd: { type: String, default: '' },
    codeExample: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverEmoji: { type: String, default: '📘' },
    order: { type: Number, default: 0 },
    lessons: { type: [LessonSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    published: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Course = model<ICourse>('Course', CourseSchema);
