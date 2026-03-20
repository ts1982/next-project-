import { createServer } from "http";
import type { Server } from "http";
import next from "next";
import { setupWebSocketServer } from "./src/lib/ws/setup";
import { connectionManager } from "./src/lib/ws/connection-manager";
import { sendPushNotifications } from "./src/lib/push/web-push";
import { prisma } from "@repo/database";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3001", 10);
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

          // WebSocket ブロードキャスト（既存）
          connectionManager.broadcast(userIds, {
            type: "NEW_NOTIFICATION",
            notification,
          });

          // Web Push 送信（非同期・失敗しても 200 を返す）
          sendWebPush(userIds, notification).catch((err) => {
            console.error("[web-push] Broadcast error:", err);
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

  // WebSocket を同一 HTTP サーバー (同一ポート) で提供
  setupWebSocketServer(server);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WS Ready on ws://${hostname}:${port}/ws`);
  });
});

/**
 * 対象ユーザーの Push サブスクリプションに Web Push を一括送信する
 * 無効になったサブスクリプションは DB から削除する
 */
async function sendWebPush(
  userIds: string[],
  notification: { title: string; body: string; type: string },
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return;

  const expiredEndpoints = await sendPushNotifications(subscriptions, {
    title: notification.title,
    body: notification.body,
    type: notification.type,
    url: "/notifications",
  });

  // 無効なサブスクリプションを削除
  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
    console.log(`[web-push] Cleaned up ${expiredEndpoints.length} expired subscriptions`);
  }
}
