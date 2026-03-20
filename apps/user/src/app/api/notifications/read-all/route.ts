import { NextResponse } from "next/server";
import { markAllNotificationsAsRead } from "@/features/notifications/services/notification.service";
import { successResponse } from "@/lib/types/api.types";
import { requireUser } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const POST = withApiHandler(async () => {
  const { user } = await requireUser();
  const result = await markAllNotificationsAsRead(user.id);
  return NextResponse.json(successResponse(result, `${result.updatedCount}件を既読にしました`));
});
