import mongoose from 'mongoose';
import { env } from './env';

export async function connectMongo(): Promise<void> {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[mongo] connected: ${env.mongoUri}`);
  } catch (e: any) {
    console.error('========================================');
    console.error('  MongoDB 连接失败!');
    console.error('========================================');
    console.error('  连接地址:', env.mongoUri);
    console.error('  错误信息:', e?.message || e);
    console.error('');
    console.error('  排查方法:');
    console.error('  1. 确认 MongoDB 是否已启动');
    console.error('     - Docker: docker compose up -d mongo');
    console.error('     - 本地安装: 启动 MongoDB 服务');
    console.error('  2. 检查地址和端口是否正确');
    console.error('  3. Docker 镜像拉取失败? 请换国内镜像源');
    console.error('     见 docker-compose.yml 顶部注释');
    console.error('========================================');
    process.exit(1);
  }
}
