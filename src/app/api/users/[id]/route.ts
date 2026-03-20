import { NextResponse } from "next/server";
import { updateUser } from "@/features/users/services/user.service";
import { prisma } from "@/lib/db/prisma";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const PATCH = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    await requirePermission("users", "update", id);

    const body = await request.json();
    logger.info("Updating user", { id, clientIp });

    const result = await updateUser(id, body);

    logger.info("User updated successfully", { id });
    return NextResponse.json(successResponse(result, "ユーザーを更新しました"));
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "ユーザーの更新" },
);

export const DELETE = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    await requirePermission("users", "delete", id);

    logger.info("Deleting user", { id, clientIp });

    await prisma.user.delete({ where: { id } });

    logger.info("User deleted successfully", { id });
    return NextResponse.json(successResponse(null, "ユーザーを削除しました"));
  },
  { rateLimit: RATE_LIMITS.STRICT, operationName: "ユーザーの削除" },
);
