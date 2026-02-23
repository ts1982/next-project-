import { NextResponse } from "next/server";
import { getUnreadCount } from "@/features/notifications/services/notification.service";
import { successResponse } from "@/lib/types/api.types";
import { requireUser } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const GET = withApiHandler(async () => {
  const { user } = await requireUser();
  const result = await getUnreadCount(user.id);
  return NextResponse.json(successResponse(result));
});
