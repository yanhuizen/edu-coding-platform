import { Request, Response, NextFunction, RequestHandler } from 'express';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found', message: '资源不存在' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: 'validation_error', message: err.message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'duplicate', message: '数据已存在' });
  }
  console.error('[error]', err);
  return res.status(500).json({ error: 'internal_error', message: '服务器开了小差,请稍后再试' });
}

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
