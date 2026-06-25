import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Submission } from '../models/Submission';
import { Assignment } from '../models/Assignment';
import { Course } from '../models/Course';
import { authRequired, requireRole } from '../middleware/auth';
import { HttpError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

function normalize(s: string | undefined | null): string {
  return (s ?? '').trim();
}

const SubmitSchema = z.object({
  assignmentId: z.string().min(1),
  code: z.string().max(20000).default(''),
  output: z.string().max(20000).default(''),
});

const GradeSchema = z.object({
  score: z.number().int().min(0).max(1000),
  comment: z.string().max(500).optional(),
});

router.post('/', authRequired, asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'student') {
    throw new HttpError(403, 'forbidden', '只有学生可以提交作业');
  }
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  if (!Types.ObjectId.isValid(parsed.data.assignmentId)) {
    throw new HttpError(400, 'validation_error', '作业 id 不对');
  }
  const a = await Assignment.findById(parsed.data.assignmentId);
  if (!a) {
    throw new HttpError(404, 'not_found', '没有这个作业');
  }

  let status: 'pending' | 'passed' | 'failed' = 'pending';
  if (a.expectedOutput !== undefined && a.expectedOutput !== null) {
    status = normalize(parsed.data.output) === normalize(a.expectedOutput) ? 'passed' : 'failed';
  }

  const sub = await Submission.create({
    studentId: req.user!._id,
    assignmentId: a._id,
    code: parsed.data.code,
    output: parsed.data.output,
    status,
    submittedAt: new Date(),
  });
  res.status(201).json({ submission: sub });
}));

router.get('/mine', authRequired, asyncHandler(async (req: Request, res: Response) => {
  const list = await Submission.find({ studentId: req.user!._id })
    .sort({ submittedAt: -1 })
    .limit(100)
    .populate('assignmentId', 'title courseId totalScore');
  res.json({ submissions: list });
}));

router.get('/by-assignment/:assignmentId', authRequired, requireRole('teacher'), asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new HttpError(400, 'validation_error', '作业 id 不对');
  }
  const a = await Assignment.findById(assignmentId);
  if (!a) {
    throw new HttpError(404, 'not_found', '没有这个作业');
  }
  const course = await Course.findOne({ _id: a.courseId, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(403, 'forbidden', '只能看自己课程的提交');
  }
  const list = await Submission.find({ assignmentId })
    .sort({ submittedAt: -1 })
    .populate('studentId', 'username displayName avatarEmoji');
  res.json({ submissions: list });
}));

router.post('/:id/grade', authRequired, requireRole('teacher'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '提交 id 不对');
  }
  const parsed = GradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  const sub = await Submission.findById(id);
  if (!sub) {
    throw new HttpError(404, 'not_found', '没有这条提交');
  }
  const a = await Assignment.findById(sub.assignmentId);
  if (!a) {
    throw new HttpError(404, 'not_found', '没有这个作业');
  }
  const course = await Course.findOne({ _id: a.courseId, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(403, 'forbidden', '只能批改自己课程的提交');
  }
  sub.score = parsed.data.score;
  sub.teacherComment = parsed.data.comment;
  sub.status = 'graded';
  sub.gradedAt = new Date();
  await sub.save();
  res.json({ submission: sub });
}));

export default router;
