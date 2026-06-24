import http from 'http';
import { createApp } from './src/app';
import { connectMongo } from './src/config/mongoose';
import { env } from './src/config/env';
import { attachLogsWS } from './src/ws/logs';

async function main() {
  await connectMongo();
  const app = createApp();
  const server = http.createServer(app);
  attachLogsWS(server, '/ws/logs');

  server.listen(env.port, () => {
    console.log(`[http] listening on http://localhost:${env.port}`);
    console.log(`[ws]   listening on ws://localhost:${env.port}/ws/logs?token=...`);
  });
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
