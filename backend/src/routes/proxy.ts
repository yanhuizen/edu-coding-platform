import express from 'express';
import https from 'https';
import http from 'http';
import { env } from '../config/env';

const router = express.Router();

// Pyodide CDN 源列表(按优先级尝试)
const PYODIDE_SOURCES = [
  'https://cdn.jsdelivr.net/pyodide/',
  'https://fastly.jsdelivr.net/pyodide/',
  'https://cdn.npmmirror.com/pyodide/',
  'https://mirrors.ustc.edu.cn/pyodide/',
];

async function fetchFromSource(url: string): Promise<{ data: Buffer; headers: any; statusCode: number }> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          headers: res.headers,
          statusCode: res.statusCode || 200,
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

async function fetchWithFallback(path: string): Promise<{ data: Buffer; headers: any; statusCode: number }> {
  for (const source of PYODIDE_SOURCES) {
    const url = source + path;
    try {
      console.log(`[proxy] Trying: ${url}`);
      const result = await fetchFromSource(url);
      if (result.statusCode === 200) {
        console.log(`[proxy] Success: ${url}`);
        return result;
      }
    } catch (e) {
      console.log(`[proxy] Failed: ${url} - ${(e as Error).message}`);
    }
  }
  throw new Error('All Pyodide CDN sources failed');
}

router.get('*', async (req, res) => {
  const path = req.path.slice(1);
  try {
    const result = await fetchWithFallback(path);
    const headers: Record<string, string> = {};
    if (result.headers['content-type']) headers['Content-Type'] = result.headers['content-type'] as string;
    if (result.headers['content-length']) headers['Content-Length'] = result.headers['content-length'] as string;
    if (result.headers['cache-control']) headers['Cache-Control'] = result.headers['cache-control'] as string;
    else headers['Cache-Control'] = 'public, max-age=31536000';
    res.writeHead(result.statusCode, headers);
    res.end(result.data);
  } catch (e) {
    console.error('[proxy] Error:', e);
    res.status(503).json({ error: '无法获取 Pyodide 文件，请检查网络连接' });
  }
});

export default router;
