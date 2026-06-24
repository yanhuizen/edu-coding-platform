import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { hashPassword, verifyPassword } from '../utils/password';
import { isValidInviteCode } from '../utils/inviteCode';
import { signToken, authRequired } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';

const router = Router();

const RegisterSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-z0-9_]+$/, '用户名只能包含小写字母、数字、下划线'),
  password: z.string().min(6).max(64),
  displayName: z.string().min(1).max(24),
  avatarEmoji: z.string().min(1).max(8).optional(),
  inviteCode: z.string().optional(),
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function publicUser(u: any) {
  return {
    id: u._id.toString(),
    username: u.username,
    displayName: u.displayName,
    avatarEmoji: u.avatarEmoji,
    role: u.role,
    classId: u.classId,
    createdAt: u.createdAt,
  };
}

router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }
  const { username, password, displayName, avatarEmoji, inviteCode } = parsed.data;

  const role: 'student' | 'teacher' = inviteCode
    ? isValidInviteCode(inviteCode)
      ? 'teacher'
      : (() => {
          throw new HttpError(400, 'invalid_invite', '邀请码不正确,需要邀请码才能注册教师账号哦~');
        })()
    : 'student';

  const exists = await User.findOne({ username: username.toLowerCase() });
  if (exists) {
    throw new HttpError(409, 'duplicate', '这个用户名已经被注册啦,换一个吧~');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    username: username.toLowerCase(),
    passwordHash,
    displayName,
    avatarEmoji: avatarEmoji || (role === 'teacher' ? '👨‍🏫' : '🐼'),
    role,
  });
  const token = signToken(user);
  res.status(201).json({ accessToken: token, tokenType: 'Bearer', user: publicUser(user) });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', '请输入用户名和密码');
  }
  const { username, password } = parsed.data;
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    throw new HttpError(401, 'unauthorized', '用户名或密码不对哦~');
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'unauthorized', '用户名或密码不对哦~');
  }
  const token = signToken(user);
  res.json({ accessToken: token, tokenType: 'Bearer', user: publicUser(user) });
});

router.get('/me', authRequired, (req: Request, res: Response) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
