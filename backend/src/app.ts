import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRouter from './routes/auth';
import coursesRouter from './routes/courses';
import assignmentsRouter from './routes/assignments';
import submissionsRouter from './routes/submissions';
import healthRouter from './routes/health';
import proxyRouter from './routes/proxy';
import aiRouter from './routes/ai';
import { notFound, errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/assignments', assignmentsRouter);
  app.use('/api/submissions', submissionsRouter);
  app.use('/api/proxy/pyodide', proxyRouter);
  app.use('/api/ai', aiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
