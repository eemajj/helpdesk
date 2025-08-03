import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/connection'; // ใช้ Prisma แทน query

interface AuthenticatedWebSocket extends WebSocket {
  userId: number;
  username: string;
  role: string;
  isAlive: boolean;
}

// ... (ส่วนที่เหลือของโค้ดเหมือนเดิม จนถึง class WebSocketService)

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<number, AuthenticatedWebSocket> = new Map(); // เปลี่ยนเป็น Map<userId, WebSocket> เพื่อให้ 1 user มีได้ 1 connection
  private pingInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) { // แก้ไข Type ของ server
    this.wss = new WebSocketServer({ server, path: '/api/ws' });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startPingInterval();

    console.log('🔌 WebSocket server initialized on /ws');
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage) {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'No token provided');
        return;
      }

      const authWs = ws as AuthenticatedWebSocket;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        console.log('✅ JWT Token decoded successfully:', decoded);
        authWs.userId = decoded.userId;
        authWs.username = decoded.username;
        authWs.role = decoded.role;
        authWs.isAlive = true;
      } catch (jwtError) {
        console.error('❌ JWT Verification failed:', jwtError);
        ws.close(1011, 'Authentication failed: Invalid or expired token');
        return;
      }

      // ถ้ามี connection เก่าของ user นี้อยู่ ให้ปิดทิ้ง
      if (this.clients.has(authWs.userId)) {
        this.clients.get(authWs.userId)?.terminate();
      }
      this.clients.set(authWs.userId, authWs);

      console.log(`✅ WebSocket client connected: ${authWs.username} (ID: ${authWs.userId})`);

      ws.on('message', (message: Buffer) => {
        if (message.toString() === 'ping') {
          ws.send('pong');
        }
      });

      ws.on('close', () => {
        this.clients.delete(authWs.userId);
        console.log(`🔌 WebSocket client disconnected: ${authWs.username}`);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for user ${authWs.username}:`, error);
        this.clients.delete(authWs.userId);
      });

      ws.on('pong', () => {
        authWs.isAlive = true;
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      ws.close(1011, 'Authentication failed');
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          console.log(`Terminating inactive connection for user ${ws.userId}`);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 60000); // เพิ่มเวลาเป็น 60 วินาที
  }

  // ========== Public Methods ==========

  public sendToUser(userId: number, type: string, data: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  }

  public sendToAdmins(type: string, data: any) {
    this.clients.forEach((client) => {
      if (client.role === 'admin' && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  }
}

export const websocketService = new WebSocketService();