import { NextResponse } from "next/server";
import { deliverDueNotifications } from "@/features/notifications/services/admin-notification.service";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const POST = withApiHandler(
  async () => {
    await requirePermission("notifications", "create");

    logger.info("Running due notification delivery");
    const result = await deliverDueNotifications();

    logger.info("Notification delivery completed", {
      delivered: result.delivered,
    });
    return NextResponse.json(successResponse(result, `${result.delivered}件の通知を配信しました`));
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "通知の配信" },
);
