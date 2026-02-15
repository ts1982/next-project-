import { NextResponse } from "next/server";
import { getNotificationsByUserId } from "@/features/notifications/services/notification.service";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const GET = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id: userId } = params;

    const { user: currentUser, scope } = await requirePermission(
      "users",
      "read",
      userId,
    );

    if (scope === "own" && currentUser.id !== userId) {
      return NextResponse.json(
        errorResponse(
          "この操作を行う権限がありません",
          undefined,
          "FORBIDDEN",
        ),
        { status: 403 },
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
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "通知の取得" },
);
