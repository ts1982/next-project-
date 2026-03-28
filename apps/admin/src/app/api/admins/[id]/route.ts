import { NextResponse } from "next/server";
import { updateAdmin } from "@/features/admins/services/admin.service";
import { prisma } from "@/lib/db/prisma";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission, ForbiddenError } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { audit } from "@/lib/audit/audit";

export const PATCH = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    const { user } = await requirePermission("admins", "update", id);

    const body = await request.json();

    // 自分自身のロール変更を禁止（権限昇格防止）
    if (body.roleId && id === user.id) {
      throw new ForbiddenError("自分自身のロールを変更することはできません");
    }

    logger.info("Updating admin", { id, clientIp });

    const result = await updateAdmin(id, body);

    if (body.roleId) {
      await audit(user.id, "admin.roleChange", `管理者 ID:${id}`, {
        targetAdminId: id,
        newRoleId: body.roleId,
      });
    }

    logger.info("Admin updated successfully", { id });
    return NextResponse.json(successResponse(result, "管理者を更新しました"));
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "管理者の更新" },
);

export const DELETE = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    const { user } = await requirePermission("admins", "delete", id);

    // 自分自身の削除を禁止
    if (id === user.id) {
      throw new ForbiddenError("自分自身を削除することはできません");
    }

    logger.info("Deleting admin", { id, clientIp });

    // 削除前に情報を保持（ログ用）
    const targetAdmin = await prisma.admin.findUnique({
      where: { id },
      select: { email: true },
    });

    await prisma.admin.delete({ where: { id } });

    await audit(user.id, "admin.delete", `管理者「${targetAdmin?.email ?? id}」`);

    logger.info("Admin deleted successfully", { id });
    return NextResponse.json(successResponse(null, "管理者を削除しました"));
  },
  { rateLimit: RATE_LIMITS.STRICT, operationName: "管理者の削除" },
);
