import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Assignment } from '../models/Assignment';
import { Course } from '../models/Course';
import { authRequired, requireRole } from '../middleware/auth';
import { HttpError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

const AssignmentCreateSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().optional(),
  title: z.string().min(1).max(80),
  prompt: z.string().max(2000).default(''),
  starterCode: z.string().max(5000).default(''),
  expectedOutput: z.string().max(1000).optional(),
  totalScore: z.number().int().min(1).max(1000).default(100),
});

const AssignmentUpdateSchema = AssignmentCreateSchema.partial().omit({ courseId: true });

router.get('/:id', authRequired, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '作业 id 不对');
  }
  const a = await Assignment.findById(id);
  if (!a) {
    throw new HttpError(404, 'not_found', '没有这个作业');
  }
  res.json({ assignment: a });
}));

router.post('/', authRequired, requireRole('teacher'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = AssignmentCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  if (!Types.ObjectId.isValid(parsed.data.courseId)) {
    throw new HttpError(400, 'validation_error', '课程 id 不对');
  }
  const course = await Course.findOne({ _id: parsed.data.courseId, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(404, 'not_found', '没有这门课,或不是你的');
  }
  const a = await Assignment.create(parsed.data);
  res.status(201).json({ assignment: a });
}));

router.put('/:id', authRequired, requireRole('teacher'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '作业 id 不对');
  }
  const parsed = AssignmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  const a = await Assignment.findById(id);
  if (!a) {
    throw new HttpError(404, 'not_found', '没有这个作业');
  }
  const course = await Course.findOne({ _id: a.courseId, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(403, 'forbidden', '只能改自己课程的作业');
  }
  Object.assign(a, parsed.data);
  await a.save();
  res.json({ assignment: a });
}));

router.delete('/:id', authRequired, requireRole('teacher'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '作业 id 不对');
  }
  const a = await Assignment.findById(id);
  if (!a) {
    throw new HttpError(404, 'not_found', '没有这个作业');
  }
  const course = await Course.findOne({ _id: a.courseId, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(403, 'forbidden', '只能删自己课程的作业');
  }
  await a.deleteOne();
  res.json({ ok: true });
}));

export default router;
