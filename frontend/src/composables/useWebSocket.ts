/**
 * WebSocket 日志推送/订阅
 * 学生端：推送代码运行日志到服务器
 * 教师端：订阅所有学生的运行日志
 */
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

export interface LogMessage {
  type: 'log' | 'hello' | 'room-switched' | 'run-start' | 'run-end' | 'error';
  from?: string;
  role?: string;
  data?: string;
  studentId?: string;
  studentName?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  courseId?: string;
  courseTitle?: string;
  room?: string;
  ts?: number;
  userId?: string;
}

let wsInstance: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function useWebSocket() {
  const auth = useAuthStore();
  const connected = ref(false);
  const logs = ref<LogMessage[]>([]);
  const onMessage = ref<((msg: LogMessage) => void) | null>(null);

  function connect(room = 'global') {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      // 已连接，切换房间
      wsInstance.send(JSON.stringify({ type: 'switch-room', room }));
      return;
    }

    // 清理旧连接
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = auth.token;
    const wsUrl = `${protocol}//${host}/ws/logs?token=${token}&room=${room}`;

    console.log('[ws] connecting...', wsUrl);
    wsInstance = new WebSocket(wsUrl);

    wsInstance.onopen = () => {
      console.log('[ws] connected');
      connected.value = true;
    };

    wsInstance.onmessage = (event) => {
      try {
        const msg: LogMessage = JSON.parse(event.data);
        logs.value.push(msg);
        if (onMessage.value) {
          onMessage.value(msg);
        }
      } catch (e) {
        console.error('[ws] parse error', e);
      }
    };

    wsInstance.onclose = () => {
      console.log('[ws] disconnected');
      connected.value = false;
      // 自动重连
      reconnectTimer = setTimeout(() => {
        console.log('[ws] reconnecting...');
        connect(room);
      }, 3000);
    };

    wsInstance.onerror = (err) => {
      console.error('[ws] error', err);
    };
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
    }
    connected.value = false;
  }

  function send(data: string) {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify({ type: 'log', data }));
    }
  }

  function sendRunEvent(event: 'run-start' | 'run-end' | 'error', data: {
    studentId: string;
    studentName: string;
    assignmentId: string;
    assignmentTitle: string;
    courseId?: string;
    courseTitle?: string;
    code?: string;
    output?: string;
    error?: string;
  }) {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify({ type: event, ...data }));
    }
  }

  onUnmounted(() => {
    disconnect();
  });

  return { connected, logs, connect, disconnect, send, sendRunEvent, onMessage };
}
