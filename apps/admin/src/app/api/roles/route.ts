import { NextResponse } from "next/server";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { getRoleList, createRole, getAllPermissions } from "@/features/roles/services/role.service";
import { createRoleSchema } from "@/features/roles/schemas/role.schema";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { audit } from "@/lib/audit/audit";

export const GET = withApiHandler(
  async (request, { clientIp }) => {
    await requirePermission("roles", "read");

    logger.info("Fetching roles", { clientIp });

    const [roleList, permissions] = await Promise.all([getRoleList(), getAllPermissions()]);

    return NextResponse.json(successResponse({ ...roleList, permissions }));
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "ロール一覧の取得" },
);

export const POST = withApiHandler(
  async (request, { clientIp }) => {
    const { user } = await requirePermission("roles", "create");

    const body = await request.json();
    const validated = createRoleSchema.parse(body);

    logger.info("Creating role", { name: validated.name, clientIp });

    const role = await createRole(validated);

    await audit(user.id, "role.create", `ロール「${role.name}」`, {
      roleId: role.id,
      permissions: validated.permissions,
    });

    logger.info("Role created successfully", { id: role.id, name: role.name });
    return NextResponse.json(successResponse(role, "ロールを作成しました"), {
      status: 201,
    });
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "ロールの作成" },
);
