/**
 * AI 助教 - Kimi API 代理
 * 后端转发请求，保护 API Key 不暴露在前端
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import https from 'https';
import { env } from '../config/env';
import { authRequired } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';

const router = Router();

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'moonshot-v1-8k';

// AI 助教系统提示词（针对小学生 Python 编程）
const SYSTEM_PROMPT = `你是"小象 AI 助教",一个专为小学生（5-6年级）服务的 Python 编程助手。

特点：
- 说话亲切、活泼,像大哥哥大姐姐一样
- 经常用 emoji 表情
- 把复杂概念用生活中的例子解释
- 代码例子要简单、容易理解
- 错误提示要友好,给出具体修改建议
- 可以帮学生理解代码、检查错误、解答编程问题

注意事项：
- 如果学生代码有问题,先夸夸他,然后温和指出问题
- 回答要简短,不要太长
- 如果学生问的内容和编程无关,温柔地引导回到编程话题
- 用中文交流`;

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  stream: z.boolean().optional().default(false),
});

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

router.post('/chat', authRequired, async (req: Request, res: Response) => {
  // 检查 API Key 是否配置
  if (!env.kimiApiKey) {
    throw new HttpError(503, 'ai_unavailable', 'AI 助教暂不可用，请联系管理员配置 API Key');
  }

  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'validation_error', parsed.error.issues[0].message);
  }

  const { messages } = parsed.data;

  // 构建完整的消息列表（加上系统提示）
  const fullMessages: KimiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const response = await callKimiAPI(fullMessages);
    res.json(response);
  } catch (e: any) {
    console.error('[ai] Kimi API error:', e.message);
    throw new HttpError(502, 'ai_error', 'AI 服务暂时不可用，请稍后再试');
  }
});

interface KimiResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function callKimiAPI(messages: KimiMessage[]): Promise<KimiResponse> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: KIMI_MODEL,
      messages,
      temperature: 0.7,
    });

    const options = {
      hostname: 'api.moonshot.cn',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.kimiApiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString();
        if (res.statusCode !== 200) {
          try {
            const err = JSON.parse(data);
            reject(new Error(err.error?.message || `HTTP ${res.statusCode}`));
          } catch {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
          return;
        }
        try {
          resolve(JSON.parse(data) as KimiResponse);
        } catch {
          reject(new Error('Invalid JSON response from Kimi'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(body);
    req.end();
  });
}

export default router;
