import type { WebSocket } from "ws";

const MAX_CONNECTIONS_PER_USER = 5;

class ConnectionManager {
  private connections = new Map<string, Set<WebSocket>>();

  add(userId: string, ws: WebSocket): void {
    let set = this.connections.get(userId);
    if (!set) {
      set = new Set();
      this.connections.set(userId, set);
    }
    // 接続数上限を超えた場合、最も古い接続を切断
    if (set.size >= MAX_CONNECTIONS_PER_USER) {
      const oldest = set.values().next().value;
      if (oldest) {
        oldest.close();
        set.delete(oldest);
      }
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

  /**
   * 指定ユーザーがアクティブな WebSocket 接続を持つかを判定する
   */
  hasActiveConnection(userId: string): boolean {
    const set = this.connections.get(userId);
    if (!set) return false;
    for (const ws of set) {
      if (ws.readyState === ws.OPEN) return true;
    }
    return false;
  }

  /**
   * ユーザー ID リストから WebSocket 接続がないユーザーをフィルタして返す
   */
  filterUsersWithoutConnection(userIds: string[]): string[] {
    return userIds.filter((id) => !this.hasActiveConnection(id));
  }

  closeAll(): void {
    for (const set of this.connections.values()) {
      for (const ws of set) {
        ws.close(1000, "Server shutting down");
      }
    }
    this.connections.clear();
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
