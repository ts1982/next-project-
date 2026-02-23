import { NextResponse } from "next/server";
import {
  getAdminNotificationList,
  createAdminNotification,
} from "@/features/notifications/services/admin-notification.service";
import { createAdminNotificationSchema } from "@/features/notifications/schemas/admin-notification.schema";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { PAGINATION } from "@/lib/constants/pagination";

export const GET = withApiHandler(
  async (request) => {
    await requirePermission("notifications", "read");

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(
      searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT),
    );

    logger.info("Fetching admin notifications", { page, limit });

    const result = await getAdminNotificationList(page, limit);

    return NextResponse.json(successResponse(result));
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "通知の取得" },
);

export const POST = withApiHandler(
  async (request) => {
    const { user } = await requirePermission("notifications", "create");

    const body = await request.json();
    logger.info("Creating admin notification", { title: body.title });

    const validated = createAdminNotificationSchema.parse(body);
    const result = await createAdminNotification(validated, user.id);

    logger.info("Admin notification created", { id: result.notification.id });
    return NextResponse.json(
      successResponse(result, "通知が正常に作成されました"),
      { status: 201 },
    );
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "通知の作成" },
);
