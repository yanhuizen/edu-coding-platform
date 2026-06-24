import { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyToken } from '../middleware/auth';
import { env } from '../config/env';

interface AuthedSocket extends WebSocket {
  userId?: string;
  role?: 'student' | 'teacher';
  username?: string;
  displayName?: string;
  roomId?: string;
}

// 房间: 'global' = 全局, 'course:' + courseId = 课程, 'assignment:' + assignmentId = 作业
const rooms = new Map<string, Set<AuthedSocket>>();

function joinRoom(socket: AuthedSocket, roomId: string) {
  socket.roomId = roomId;
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId)!.add(socket);
}

function leaveRoom(socket: AuthedSocket) {
  if (!socket.roomId) return;
  const set = rooms.get(socket.roomId);
  if (set) {
    set.delete(socket);
    if (set.size === 0) rooms.delete(socket.roomId);
  }
  socket.roomId = undefined;
}

function broadcast(roomId: string, message: any, exclude?: AuthedSocket) {
  const set = rooms.get(roomId);
  if (!set) return;
  const data = JSON.stringify(message);
  for (const client of set) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// 广播给所有房间（教师大屏用）
function broadcastToTeachers(message: any, exclude?: AuthedSocket) {
  for (const [roomId, set] of rooms.entries()) {
    // 跳过 global 房间，只广播有意义的事件
    if (roomId === 'global') continue;
    for (const client of set) {
      if (client === exclude) continue;
      if (client.role === 'teacher' && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }
}

export function attachLogsWS(server: any, path = '/ws/logs') {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    if (!req.url?.startsWith(path)) {
      // 其它 path 不处理
      return;
    }
    wss.handleUpgrade(req, socket as any, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws: AuthedSocket, req: IncomingMessage) => {
    try {
      const url = new URL(req.url ?? '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const room = url.searchParams.get('room') ?? 'global';
      if (!token) {
        ws.close(4001, 'no token');
        return;
      }
      const payload = verifyToken(token);
      ws.userId = payload.sub;
      ws.role = payload.role;
      ws.username = payload.username;
      ws.displayName = payload.displayName;
      joinRoom(ws, room);

      ws.send(JSON.stringify({ type: 'hello', userId: payload.sub, role: payload.role, room, displayName: payload.displayName }));

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'log' && typeof msg.data === 'string') {
            broadcast(ws.roomId ?? 'global', {
              type: 'log',
              from: ws.username,
              displayName: ws.displayName,
              role: ws.role,
              data: msg.data,
              ts: Date.now(),
            }, ws);
          } else if (msg.type === 'switch-room' && typeof msg.room === 'string') {
            leaveRoom(ws);
            joinRoom(ws, msg.room);
            ws.send(JSON.stringify({ type: 'room-switched', room: msg.room }));
          }
          // 学生运行代码事件：run-start, run-end, error
          else if (['run-start', 'run-end', 'error'].includes(msg.type) && ws.role === 'student') {
            const eventData = {
              type: msg.type,
              studentId: ws.userId,
              studentName: ws.displayName || ws.username,
              username: ws.username,
              assignmentId: msg.assignmentId,
              assignmentTitle: msg.assignmentTitle,
              courseId: msg.courseId,
              courseTitle: msg.courseTitle,
              code: msg.code,
              output: msg.output,
              error: msg.error,
              ts: Date.now(),
            };
            // 广播给所有教师（大屏）
            broadcastToTeachers(eventData, ws);
            // 也广播给 global 房间的教师
            broadcast('global', eventData, ws);
          }
        } catch {
          // ignore
        }
      });

      ws.on('close', () => {
        leaveRoom(ws);
      });
    } catch (e) {
      console.error('[ws] auth error', e);
      ws.close(4003, 'auth error');
    }
  });

  console.log(`[ws] logs server ready at ${path}`);
  // env used to silence unused warning
  void env;
  return wss;
}
