import type { WebSocket } from "ws";

class ConnectionManager {
  private connections = new Map<string, Set<WebSocket>>();

  add(userId: string, ws: WebSocket): void {
    let set = this.connections.get(userId);
    if (!set) {
      set = new Set();
      this.connections.set(userId, set);
    }
    set.add(ws);
  }

  remove(userId: string, ws: WebSocket): void {
    const set = this.connections.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      this.connections.delete(userId);
    }
  }

  broadcast(userIds: string[], payload: unknown): void {
    const message = JSON.stringify(payload);
    for (const userId of userIds) {
      const set = this.connections.get(userId);
      if (!set) continue;
      for (const ws of set) {
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
        }
      }
    }
  }

  getConnectionCount(): number {
    let count = 0;
    for (const set of this.connections.values()) {
      count += set.size;
    }
    return count;
  }
}

// globalThis パターンで HMR 時の参照切れを防止
const globalForWs = globalThis as unknown as {
  connectionManager: ConnectionManager | undefined;
};

export const connectionManager = globalForWs.connectionManager ?? new ConnectionManager();

if (process.env.NODE_ENV !== "production") {
  globalForWs.connectionManager = connectionManager;
}
