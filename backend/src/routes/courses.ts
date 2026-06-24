import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Course } from '../models/Course';
import { Assignment } from '../models/Assignment';
import { authRequired, requireRole } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';

const router = Router();

const CourseCreateSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().max(500).optional(),
  coverEmoji: z.string().min(1).max(8).optional(),
  order: z.number().int().min(0).optional(),
});

const LessonSchema = z.object({
  title: z.string().min(1).max(60),
  contentMd: z.string().default(''),
  codeExample: z.string().default(''),
  order: z.number().int().min(0).default(0),
});

const CourseUpdateSchema = z.object({
  title: z.string().min(1).max(60).optional(),
  description: z.string().max(500).optional(),
  coverEmoji: z.string().min(1).max(8).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

// 学生:列出已发布课程;教师:列出自己创建的课程
router.get('/', authRequired, async (req: Request, res: Response) => {
  const user = req.user!;
  if (user.role === 'teacher') {
    const list = await Course.find({ createdBy: user._id }).sort({ order: 1, createdAt: -1 });
    return res.json({ courses: list });
  }
  const list = await Course.find({ published: true }).sort({ order: 1, createdAt: -1 });
  return res.json({ courses: list });
});

router.get('/:id', authRequired, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '课程 id 不对');
  }
  const course = await Course.findById(id);
  if (!course) {
    throw new HttpError(404, 'not_found', '没有这门课');
  }
  const user = req.user!;
  if (user.role === 'student' && !course.published) {
    throw new HttpError(403, 'forbidden', '这门课还没发布');
  }
  res.json({ course });
});

router.post('/', authRequired, requireRole('teacher'), async (req: Request, res: Response) => {
  const parsed = CourseCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  const course = await Course.create({
    ...parsed.data,
    createdBy: req.user!._id,
    published: false,
  });
  res.status(201).json({ course });
});

router.put('/:id', authRequired, requireRole('teacher'), async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '课程 id 不对');
  }
  const parsed = CourseUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  const course = await Course.findOne({ _id: id, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(404, 'not_found', '没有这门课,或不是你的');
  }
  Object.assign(course, parsed.data);
  await course.save();
  res.json({ course });
});

router.post('/:id/lessons', authRequired, requireRole('teacher'), async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '课程 id 不对');
  }
  const parsed = LessonSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  const course = await Course.findOne({ _id: id, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(404, 'not_found', '没有这门课,或不是你的');
  }
  course.lessons.push(parsed.data as any);
  course.lessons.sort((a, b) => a.order - b.order);
  await course.save();
  res.status(201).json({ course });
});

router.put('/:id/lessons/:lessonId', authRequired, requireRole('teacher'), async (req: Request, res: Response) => {
  const { id, lessonId } = req.params;
  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(lessonId)) {
    throw new HttpError(400, 'validation_error', 'id 不对');
  }
  const parsed = LessonSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  const course = await Course.findOne({ _id: id, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(404, 'not_found', '没有这门课,或不是你的');
  }
  const lesson = course.lessons.find((l: any) => l._id.toString() === lessonId);
  if (!lesson) {
    throw new HttpError(404, 'not_found', '没有这个课时');
  }
  Object.assign(lesson, parsed.data);
  course.lessons.sort((a, b) => a.order - b.order);
  await course.save();
  res.json({ course });
});

router.delete('/:id/lessons/:lessonId', authRequired, requireRole('teacher'), async (req: Request, res: Response) => {
  const { id, lessonId } = req.params;
  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(lessonId)) {
    throw new HttpError(400, 'validation_error', 'id 不对');
  }
  const course = await Course.findOne({ _id: id, createdBy: req.user!._id });
  if (!course) {
    throw new HttpError(404, 'not_found', '没有这门课,或不是你的');
  }
  course.lessons = course.lessons.filter((l: any) => l._id.toString() !== lessonId) as any;
  await course.save();
  res.json({ course });
});

// 学生/教师查看课程下的所有作业
router.get('/:id/assignments', authRequired, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'validation_error', '课程 id 不对');
  }
  const list = await Assignment.find({ courseId: id }).sort({ createdAt: 1 });
  res.json({ assignments: list });
});

export default router;
