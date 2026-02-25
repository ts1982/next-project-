import { WebSocket, WebSocketServer } from "ws";
import type { Server, IncomingMessage } from "http";
import { connectionManager } from "./connection-manager";
import { authenticateWs } from "./auth";

type AuthenticatedRequest = IncomingMessage & { userId?: string };
type AliveWebSocket = WebSocket & { isAlive?: boolean };

export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    verifyClient: (info, cb) => {
      authenticateWs(info.req)
        .then((userId) => {
          if (!userId) {
            cb(false, 401, "Unauthorized");
            return;
          }
          (info.req as AuthenticatedRequest).userId = userId;
          cb(true);
        })
        .catch(() => {
          cb(false, 500, "Internal Server Error");
        });
    },
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      ws.close();
      return;
    }
    connectionManager.add(userId, ws);
    console.log(
      `[ws] Connected: userId=${userId} (total: ${connectionManager.getConnectionCount()})`,
    );

    ws.on("close", () => {
      connectionManager.remove(userId, ws);
      console.log(
        `[ws] Disconnected: userId=${userId} (total: ${connectionManager.getConnectionCount()})`,
      );
    });

    ws.on("pong", () => {
      (ws as AliveWebSocket).isAlive = true;
    });

    (ws as AliveWebSocket).isAlive = true;
  });

  // ping/pong でコネクション維持（30秒間隔）
  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      const client = ws as AliveWebSocket;
      if (!client.isAlive) {
        ws.terminate();
        continue;
      }
      client.isAlive = false;
      ws.ping();
    }
  }, 30_000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}
