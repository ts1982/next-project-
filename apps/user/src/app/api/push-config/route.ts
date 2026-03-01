import { NextResponse } from "next/server";

/**
 * VAPID 公開鍵をランタイム環境変数から返すエンドポイント。
 * NEXT_PUBLIC_* はビルド時インライン化されるため、
 * Docker ビルド後のランタイムで正しい値を得るにはこの方式が必要。
 */
export function GET() {
  return NextResponse.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
  });
}
