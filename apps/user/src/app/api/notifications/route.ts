import { NextResponse } from "next/server";
import { getNotificationsByUserId } from "@/features/notifications/services/notification.service";
import { successResponse } from "@/lib/types/api.types";
import { requireUser } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const GET = withApiHandler(async (request) => {
  const { user } = await requireUser();

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "20"), 1),
    100,
  );

  const result = await getNotificationsByUserId(user.id, cursor, limit);
  return NextResponse.json(successResponse(result));
});
