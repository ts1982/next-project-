import { NextRequest, NextResponse } from "next/server";
import { deliverDueNotifications } from "@/features/notifications/services/admin-notification.service";
import { logger } from "@/lib/utils/logger";

/**
 * Cron ジョブ用の通知配信エンドポイント
 * 毎分呼び出され、配信時刻を過ぎた scheduledAt 通知を配信する
 *
 * 認証: Authorization: Bearer <CRON_SECRET> ヘッダーで保護
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("CRON_SECRET is not set");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token !== cronSecret) {
    logger.warn("Cron deliver: unauthorized request", {
      ip: request.headers.get("x-forwarded-for") ?? "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info("Cron: running due notification delivery");
    const result = await deliverDueNotifications();
    logger.info("Cron: notification delivery completed", {
      delivered: result.delivered,
    });

    return NextResponse.json({
      ok: true,
      delivered: result.delivered,
      message: `${result.delivered}件の通知を配信しました`,
    });
  } catch (error) {
    logger.error("Cron: notification delivery failed", { error });
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}
