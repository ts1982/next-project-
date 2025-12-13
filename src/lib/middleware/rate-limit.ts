type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

// シンプルなインメモリストア（本番環境ではRedisなどを使用）
const requests = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (identifier: string): Promise<boolean> => {
    const now = Date.now();
    const record = requests.get(identifier);

    // レコードが存在しないか、ウィンドウが期限切れの場合
    if (!record || now > record.resetTime) {
      requests.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // リクエスト数が制限を超えている場合
    if (record.count >= config.maxRequests) {
      return false;
    }

    // リクエスト数をインクリメント
    record.count++;
    return true;
  };
}

// 定期的に古いレコードをクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requests.entries()) {
    if (now > record.resetTime) {
      requests.delete(key);
    }
  }
}, 60000); // 1分ごと

// プリセット設定
export const RATE_LIMITS = {
  GET: { windowMs: 60000, maxRequests: 10 }, // 1分間に10リクエスト
  POST: { windowMs: 60000, maxRequests: 5 }, // 1分間に5リクエスト
  STRICT: { windowMs: 60000, maxRequests: 3 }, // 1分間に3リクエスト
} as const;
