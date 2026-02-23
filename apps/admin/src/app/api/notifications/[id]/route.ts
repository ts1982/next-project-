import { NextResponse } from "next/server";
import {
  getAdminNotificationById,
  updateAdminNotification,
  deleteAdminNotification,
  ConflictError,
} from "@/features/notifications/services/admin-notification.service";
import { updateAdminNotificationSchema } from "@/features/notifications/schemas/admin-notification.schema";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const GET = withApiHandler(
  async (request, { params }) => {
    await requirePermission("notifications", "read");
    const { id } = params;

    const notification = await getAdminNotificationById(id);
    return NextResponse.json(successResponse({ notification }));
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "通知の取得" },
);

export const PATCH = withApiHandler(
  async (request, { params }) => {
    await requirePermission("notifications", "update");
    const { id } = params;

    const body = await request.json();
    const validated = updateAdminNotificationSchema.parse(body);

    try {
      const result = await updateAdminNotification(id, validated);
      logger.info("Admin notification updated", { id });
      return NextResponse.json(
        successResponse(result, "通知を更新しました"),
      );
    } catch (err) {
      if (err instanceof ConflictError) {
        return NextResponse.json(
          errorResponse(err.message, undefined, "ALREADY_DELIVERED"),
          { status: 409 },
        );
      }
      throw err;
    }
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "通知の更新" },
);

export const DELETE = withApiHandler(
  async (request, { params }) => {
    await requirePermission("notifications", "delete");
    const { id } = params;

    try {
      await deleteAdminNotification(id);
      logger.info("Admin notification deleted", { id });
      return NextResponse.json(
        successResponse(null, "通知を削除しました"),
      );
    } catch (err) {
      if (err instanceof ConflictError) {
        return NextResponse.json(
          errorResponse(err.message, undefined, "ALREADY_DELIVERED"),
          { status: 409 },
        );
      }
      throw err;
    }
  },
  { rateLimit: RATE_LIMITS.STRICT, operationName: "通知の削除" },
);
