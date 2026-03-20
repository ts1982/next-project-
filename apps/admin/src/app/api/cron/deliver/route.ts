import { NextRequest, NextResponse } from "next/server";
import { deliverDueNotifications } from "@/features/notifications/services/admin-notification.service";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error("CRON_SECRET is not configured");
    return NextResponse.json(errorResponse("サーバー設定エラー", undefined, "SERVER_ERROR"), {
      status: 500,
    });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(errorResponse("認証に失敗しました", undefined, "UNAUTHORIZED"), {
      status: 401,
    });
  }

  logger.info("Cron: Running due notification delivery");
  const result = await deliverDueNotifications();

  logger.info("Cron: Notification delivery completed", {
    delivered: result.delivered,
  });
  return NextResponse.json(successResponse(result, `${result.delivered}件の通知を配信しました`));
}
