import { NextResponse } from "next/server";
import { markNotificationAsRead } from "@/features/notifications/services/notification.service";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { requireUser } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const PATCH = withApiHandler(async (request, { params }) => {
  const { user } = await requireUser();
  const { notificationId } = params;

  try {
    await markNotificationAsRead(user.id, notificationId);
    return NextResponse.json(successResponse(null, "既読にしました"));
  } catch {
    return NextResponse.json(errorResponse("通知が見つかりません", undefined, "NOT_FOUND"), {
      status: 404,
    });
  }
});
