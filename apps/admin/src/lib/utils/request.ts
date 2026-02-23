import type { NextRequest } from "next/server";

/**
 * リクエストからクライアントIPアドレスを取得する
 *
 * X-Forwarded-For > X-Real-Ip > "unknown" の優先度で取得
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}
