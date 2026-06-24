import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';

export interface AuthPayload {
  sub: string;
  username: string;
  role: 'student' | 'teacher';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
      user?: IUser;
    }
  }
}

export function signToken(user: IUser): string {
  const payload: AuthPayload = {
    sub: user._id.toString(),
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtSecret) as AuthPayload;
}

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: '缺少登录凭证' });
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'unauthorized', message: '用户不存在' });
    }
    req.auth = payload;
    req.user = user;
    next();
  } catch (_e) {
    return res.status(401).json({ error: 'unauthorized', message: '登录已过期,请重新登录' });
  }
}

export function requireRole(role: 'student' | 'teacher') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'unauthorized', message: '请先登录' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'forbidden', message: `需要 ${role} 权限` });
    }
    next();
  };
}
