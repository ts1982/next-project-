import { createServer } from "http";
import type { Server } from "http";
import next from "next";
import { setupWebSocketServer } from "./src/lib/ws/setup";
import { connectionManager } from "./src/lib/ws/connection-manager";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3001", 10);
const wsPort = parseInt(process.env.WS_PORT || "3002", 10);
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "dev-secret";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // /api/internal/broadcast はカスタムサーバーで直接処理
    // （Next.js Route Handler ではconnectionManagerが別インスタンスになるため）
    if (req.url === "/api/internal/broadcast" && req.method === "POST") {
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${INTERNAL_API_SECRET}`) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const { userIds, notification } = JSON.parse(body);
          if (!userIds?.length || !notification) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Bad request" }));
            return;
          }
          connectionManager.broadcast(userIds, {
            type: "NEW_NOTIFICATION",
            notification,
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    handle(req, res);
  });

  // Next.js の HMR upgrade ハンドラを起動時に 1 回だけ登録
  const nextCustomServer = app as unknown as {
    setupWebSocketHandler?: (customServer: Server) => void;
  };
  nextCustomServer.setupWebSocketHandler?.(server);

  const wsServer = createServer();
  setupWebSocketServer(wsServer);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  wsServer.listen(wsPort, () => {
    console.log(`> WS Ready on ws://${hostname}:${wsPort}/ws`);
  });
});
