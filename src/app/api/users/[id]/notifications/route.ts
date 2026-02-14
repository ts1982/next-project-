import { NextRequest, NextResponse } from "next/server";
import { getNotificationsByUserId } from "@/features/notifications/services/notification.service";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import {
  requirePermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/guards";

const getRateLimit = rateLimit(RATE_LIMITS.GET);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const clientIp = getClientIp(request);
  const { id: userId } = await params;

  try {
    // ユーザー閲覧権限チェック（scope: "own" なら自分の通知のみ）
    const { user: currentUser, scope } = await requirePermission(
      "users",
      "read",
      userId,
    );

    // scope が "own" の場合、自分以外の通知は取得不可
    if (scope === "own" && currentUser.id !== userId) {
      return NextResponse.json(
        errorResponse("この操作を行う権限がありません", undefined, "FORBIDDEN"),
        { status: 403 },
      );
    }

    // Rate limiting
    const allowed = await getRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp, method: "GET" });
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20"), 1),
      100,
    );

    logger.info("Fetching notifications", { userId, cursor, limit, clientIp });

    const result = await getNotificationsByUserId(userId, cursor, limit);

    logger.info("Notifications fetched successfully", {
      userId,
      count: result.notifications.length,
      hasMore: result.pagination.hasMore,
    });

    return NextResponse.json(successResponse(result));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn("Unauthorized access", { userId, clientIp });
      return NextResponse.json(
        errorResponse("認証が必要です", undefined, "UNAUTHORIZED"),
        { status: 401 },
      );
    }
    if (error instanceof ForbiddenError) {
      logger.warn("Forbidden access", { userId, clientIp });
      return NextResponse.json(
        errorResponse("この操作を行う権限がありません", undefined, "FORBIDDEN"),
        { status: 403 },
      );
    }

    logger.error("Failed to fetch notifications", { error, userId, clientIp });
    return NextResponse.json(errorResponse("通知の取得に失敗しました"), {
      status: 500,
    });
  }
}
