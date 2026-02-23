import { NextResponse } from "next/server";
import { updateAdmin } from "@/features/admins/services/admin.service";
import { prisma } from "@/lib/db/prisma";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const PATCH = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    await requirePermission("admins", "update", id);

    const body = await request.json();
    logger.info("Updating admin", { id, clientIp });

    const result = await updateAdmin(id, body);

    logger.info("Admin updated successfully", { id });
    return NextResponse.json(
      successResponse(result, "管理者を更新しました"),
    );
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "管理者の更新" },
);

export const DELETE = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    await requirePermission("admins", "delete", id);

    logger.info("Deleting admin", { id, clientIp });

    await prisma.admin.delete({ where: { id } });

    logger.info("Admin deleted successfully", { id });
    return NextResponse.json(
      successResponse(null, "管理者を削除しました"),
    );
  },
  { rateLimit: RATE_LIMITS.STRICT, operationName: "管理者の削除" },
);
