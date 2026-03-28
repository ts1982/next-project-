import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission, ForbiddenError } from "@/lib/auth/guards";
import { getRoleById, updateRole, deleteRole } from "@/features/roles/services/role.service";
import { updateRoleSchema } from "@/features/roles/schemas/role.schema";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { audit } from "@/lib/audit/audit";

export const GET = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    await requirePermission("roles", "read");

    logger.info("Fetching role detail", { id, clientIp });

    const role = await getRoleById(id);
    if (!role) {
      return NextResponse.json(errorResponse("ロールが見つかりません", undefined, "NOT_FOUND"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(role));
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "ロール詳細の取得" },
);

export const PATCH = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    const { user } = await requirePermission("roles", "update");

    // 自分が所属するロールの権限変更を禁止（権限昇格防止）
    if (user.roleId === id) {
      throw new ForbiddenError("自分が所属するロールの権限は変更できません");
    }

    const body = await request.json();
    const validated = updateRoleSchema.parse(body);

    logger.info("Updating role", { id, clientIp });

    const role = await updateRole(id, validated);

    await audit(user.id, "role.update", `ロール「${role.name}」`, {
      roleId: id,
      changes: validated,
    });

    logger.info("Role updated successfully", { id, name: role.name });
    return NextResponse.json(successResponse(role, "ロールを更新しました"));
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "ロールの更新" },
);

export const DELETE = withApiHandler(
  async (request, { clientIp, params }) => {
    const { id } = params;
    const { user } = await requirePermission("roles", "delete");

    logger.info("Deleting role", { id, clientIp });

    // 削除前にロール名を取得（ログ用）
    const targetRole = await getRoleById(id);
    await deleteRole(id);

    await audit(user.id, "role.delete", `ロール「${targetRole?.name ?? id}」`);

    logger.info("Role deleted successfully", { id });
    return NextResponse.json(successResponse(null, "ロールを削除しました"));
  },
  { rateLimit: RATE_LIMITS.STRICT, operationName: "ロールの削除" },
);
