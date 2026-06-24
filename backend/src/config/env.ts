import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/edu_coding'),
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-please-change'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  teacherInviteCodes: (process.env.TEACHER_INVITE_CODES ?? 'DEMO2026,TEACH2026')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
  // Kimi API Key（可选，用于 AI 助教功能）
  kimiApiKey: process.env.KIMI_API_KEY || '',
};
