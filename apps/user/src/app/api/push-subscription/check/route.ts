import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { successResponse } from "@/lib/types/api.types";

/** サーバー側に Push サブスクリプションが存在するか確認 */
export const GET = withApiHandler(async (request) => {
  const { user } = await requireUser();
  const endpoint = request.nextUrl.searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(successResponse({ exists: false }));
  }

  const sub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id, endpoint },
    select: { id: true },
  });

  return NextResponse.json(successResponse({ exists: !!sub }));
});
