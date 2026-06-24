<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import { aiApi, type AIMessage } from '@/api/ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
}

const isOpen = ref(false);
const messages = ref<ChatMessage[]>([
  {
    id: '1',
    role: 'assistant',
    content: '🐘 你好呀！我是小象 AI 助教！\n\n有什么 Python 编程问题都可以问我哦~\n\n比如：\n• 代码哪里报错了\n• 某个功能怎么写\n• 概念不理解',
  },
]);
const inputText = ref('');
const loading = ref(false);
const error = ref('');
const chatContainer = ref<HTMLElement | null>(null);

const canSend = computed(() => inputText.value.trim().length > 0 && !loading.value);

async function send() {
  if (!canSend.value) return;

  const userMsg = inputText.value.trim();
  inputText.value = '';
  error.value = '';

  // 添加用户消息
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: userMsg,
  });

  loading.value = true;
  await scrollToBottom();

  try {
    const historyMessages: AIMessage[] = messages.value.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await aiApi.chat(historyMessages);
    const reply = res.choices[0]?.message?.content || '抱歉，我没有理解你的问题...';

    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
    });
  } catch (e: any) {
    error.value = e?.message || 'AI 暂时不在线，请稍后再试';
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '😅 哎呀，AI 助手暂时不在线。\n\n可能的原因：\n• 网络连接问题\n• AI 服务暂时维护中\n\n你可以：\n• 检查网络后重试\n• 先看看错误提示有没有解决思路',
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

function clearChat() {
  messages.value = [
    {
      id: '1',
      role: 'assistant',
      content: '🐘 对话已清空！\n\n有什么新问题尽管问我~',
    },
  ];
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

// 快捷问题
const quickQuestions = [
  '帮我看看这个错误',
  'print 怎么用？',
  '什么是变量？',
  'for 循环怎么写？',
];

function useQuickQuestion(q: string) {
  inputText.value = q;
  send();
}
</script>

<template>
  <!-- 悬浮按钮 -->
  <button class="ai-fab" @click="isOpen = !isOpen" :class="{ active: isOpen }">
    <span class="fab-icon">{{ isOpen ? '✕' : '🐘' }}</span>
    <span class="fab-label">{{ isOpen ? '关闭' : 'AI 助教' }}</span>
  </button>

  <!-- 聊天面板 -->
  <Transition name="slide-up">
    <div v-if="isOpen" class="ai-panel card">
      <header class="panel-header">
        <div class="header-info">
          <span class="ai-avatar">🐘</span>
          <div>
            <div class="ai-name">小象 AI 助教</div>
            <div class="ai-status">Kimi 大模型驱动</div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-icon" @click="clearChat" title="清空对话">🗑️</button>
        </div>
      </header>

      <div ref="chatContainer" class="chat-body">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['chat-msg', msg.role]"
        >
          <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🐘' }}</div>
          <div class="msg-bubble">
            <pre class="msg-text">{{ msg.content }}</pre>
          </div>
        </div>

        <div v-if="loading" class="chat-msg assistant">
          <div class="msg-avatar">🐘</div>
          <div class="msg-bubble">
            <div class="typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-tip">⚠️ {{ error }}</div>

      <div class="quick-questions">
        <button
          v-for="q in quickQuestions"
          :key="q"
          class="quick-btn"
          @click="useQuickQuestion(q)"
        >
          {{ q }}
        </button>
      </div>

      <footer class="panel-footer">
        <textarea
          v-model="inputText"
          class="input-area"
          placeholder="问 AI 助教..."
          rows="2"
          :disabled="loading"
          @keydown="handleKeydown"
        ></textarea>
        <button class="btn send-btn" :disabled="!canSend" @click="send">
          {{ loading ? '思考中...' : '发送' }}
        </button>
      </footer>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.ai-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: white;
  border: none;
  border-radius: $radius-pill;
  box-shadow: 0 4px 16px rgba($primary, 0.4);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($primary, 0.5);
  }

  &.active {
    background: #666;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

.fab-icon {
  font-size: 20px;
}

.fab-label {
  font-weight: 600;
}

.ai-panel {
  position: fixed;
  bottom: 80px;
  right: 24px;
  z-index: 49;
  width: 380px;
  max-width: calc(100vw - 48px);
  max-height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid $border;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-avatar {
  font-size: 36px;
}

.ai-name {
  font-weight: 700;
  font-size: 16px;
}

.ai-status {
  font-size: 12px;
  color: $text-muted;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
  max-height: 320px;
}

.chat-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;

    .msg-bubble {
      background: $primary;
      color: white;
    }
  }

  &.assistant .msg-bubble {
    background: #F5F5F5;
    color: $text;
  }
}

.msg-avatar {
  font-size: 28px;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
}

.msg-text {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 8px;
    height: 8px;
    background: $text-muted;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.error-tip {
  background: #FFEBEE;
  color: #B71C1C;
  padding: 8px 12px;
  border-radius: $radius;
  font-size: 14px;
  margin-bottom: 8px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.quick-btn {
  background: $primary-light;
  border: 1px solid $primary;
  color: $primary-dark;
  padding: 4px 10px;
  border-radius: $radius-pill;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: $primary;
    color: white;
  }
}

.panel-footer {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding-top: 12px;
  border-top: 1px solid $border;
}

.input-area {
  flex: 1;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  padding: 10px 12px;
  border: 1px solid $border;
  border-radius: $radius;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: $primary;
  }
}

.send-btn {
  padding: 10px 16px;
  background: $primary;
  color: white;
  border: none;
  border-radius: $radius;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
