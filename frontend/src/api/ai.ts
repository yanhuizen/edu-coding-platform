/**
 * AI 助教 API
 */
import { api } from './index';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  id: string;
  choices: Array<{
    index: number;
    message: AIMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const aiApi = {
  /**
   * 发送消息给 AI 助教
   * @param messages 消息历史
   */
  chat(messages: AIMessage[]): Promise<AIResponse> {
    return api.post('/ai/chat', { messages });
  },
};
