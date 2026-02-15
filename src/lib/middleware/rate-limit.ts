type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

// シンプルなインメモリストア（本番環境ではRedisなどを使用）
const requests = new Map<string, { count: number; resetTime: number }>();

// 各 rateLimit() 呼び出しごとにユニークなプレフィックスを付与し、
// エンドポイント間でカウンターが共有されないようにする
let instanceId = 0;

export function rateLimit(config: RateLimitConfig) {
  const prefix = `rl${instanceId++}`;

  return async (identifier: string): Promise<boolean> => {
    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const record = requests.get(key);

    // レコードが存在しないか、ウィンドウが期限切れの場合
    if (!record || now > record.resetTime) {
      requests.set(key, {
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
  GET: { windowMs: 60000, maxRequests: 60 }, // 1分間に60リクエスト
  POST: { windowMs: 60000, maxRequests: 10 }, // 1分間に10リクエスト
  STRICT: { windowMs: 60000, maxRequests: 5 }, // 1分間に5リクエスト
} as const;
