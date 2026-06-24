/**
 * 创建演示账号(教师 + 学生)
 * 然后调用 seed-courses 灌入 7 节示例课
 * 使用: cd backend && npm run seed:demo
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { connectMongo } from '../src/config/mongoose';
import { User } from '../src/models/User';
import { hashPassword } from '../src/utils/password';
import { runSeed } from './seed-courses';

const TEACHER = { username: 'teacher', displayName: '王老师', password: '123456', emoji: '👨‍🏫' };
const STUDENT = { username: 'student', displayName: '小明同学', password: '123456', emoji: '🐼' };

async function ensureUser(payload: {
  username: string;
  displayName: string;
  password: string;
  emoji: string;
  role: 'student' | 'teacher';
}) {
  const existing = await User.findOne({ username: payload.username });
  if (existing) {
    console.log(`[demo] user exists: ${payload.username}`);
    return existing;
  }
  const u = await User.create({
    username: payload.username,
    passwordHash: await hashPassword(payload.password),
    displayName: payload.displayName,
    avatarEmoji: payload.emoji,
    role: payload.role,
  });
  console.log(`[demo] created ${payload.role}: ${payload.username} / ${payload.password}`);
  return u;
}

async function main() {
  await connectMongo();
  await ensureUser({ ...TEACHER, role: 'teacher' });
  await ensureUser({ ...STUDENT, role: 'student' });

  // 灌入 7 节示例课
  await runSeed();

  console.log('\n✅ Demo 数据就绪!');
  console.log('   教师: teacher / 123456 (邀请码 DEMO2026)');
  console.log('   学生: student / 123456');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('[demo] failed:', e);
  process.exit(1);
});
