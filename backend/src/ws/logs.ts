import { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyToken } from '../middleware/auth';
import { env } from '../config/env';

interface AuthedSocket extends WebSocket {
  userId?: string;
  role?: 'student' | 'teacher';
  username?: string;
  roomId?: string;
}

// 房间: 学生 username 或 assignmentId
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
      joinRoom(ws, room);

      ws.send(JSON.stringify({ type: 'hello', userId: payload.sub, role: payload.role, room }));

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'log' && typeof msg.data === 'string') {
            broadcast(ws.roomId ?? 'global', {
              type: 'log',
              from: ws.username,
              role: ws.role,
              data: msg.data,
              ts: Date.now(),
            }, ws);
          } else if (msg.type === 'switch-room' && typeof msg.room === 'string') {
            leaveRoom(ws);
            joinRoom(ws, msg.room);
            ws.send(JSON.stringify({ type: 'room-switched', room: msg.room }));
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
