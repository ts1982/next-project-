import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import {
  requirePermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/guards";
import {
  getRoleById,
  updateRole,
  deleteRole,
} from "@/features/roles/services/role.service";
import { updateRoleSchema } from "@/features/roles/schemas/role.schema";

const getRateLimit = rateLimit(RATE_LIMITS.GET);
const patchRateLimit = rateLimit(RATE_LIMITS.POST);
const deleteRateLimit = rateLimit(RATE_LIMITS.STRICT);

// ---------------------------------------------------------------------------
// GET /api/roles/[id] — ロール詳細
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const clientIp = getClientIp(request);
  const { id } = await params;

  try {
    await requirePermission("roles", "read");

    const allowed = await getRateLimit(clientIp);
    if (!allowed) {
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    logger.info("Fetching role detail", { id, clientIp });

    const role = await getRoleById(id);
    if (!role) {
      return NextResponse.json(
        errorResponse("ロールが見つかりません", undefined, "NOT_FOUND"),
        { status: 404 },
      );
    }

    return NextResponse.json(successResponse(role));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        errorResponse("認証が必要です", undefined, "UNAUTHORIZED"),
        { status: 401 },
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        errorResponse("この操作を行う権限がありません", undefined, "FORBIDDEN"),
        { status: 403 },
      );
    }
    logger.error("Failed to fetch role", { error, id, clientIp });
    return NextResponse.json(errorResponse("ロール詳細の取得に失敗しました"), {
      status: 500,
    });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/roles/[id] — ロール更新
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const clientIp = getClientIp(request);
  const { id } = await params;

  try {
    await requirePermission("roles", "update");

    const allowed = await patchRateLimit(clientIp);
    if (!allowed) {
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = updateRoleSchema.parse(body);

    logger.info("Updating role", { id, clientIp });

    const role = await updateRole(id, validated);

    logger.info("Role updated successfully", { id, name: role.name });
    return NextResponse.json(successResponse(role, "ロールを更新しました"));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        errorResponse("認証が必要です", undefined, "UNAUTHORIZED"),
        { status: 401 },
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        errorResponse("この操作を行う権限がありません", undefined, "FORBIDDEN"),
        { status: 403 },
      );
    }
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      logger.warn("Validation error", { fieldErrors, clientIp });
      return NextResponse.json(
        errorResponse("バリデーションエラー", fieldErrors, "VALIDATION_ERROR"),
        { status: 400 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          errorResponse(
            "このロール名は既に使用されています",
            undefined,
            "DUPLICATE_NAME",
          ),
          { status: 409 },
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          errorResponse("ロールが見つかりません", undefined, "NOT_FOUND"),
          { status: 404 },
        );
      }
    }
    logger.error("Failed to update role", { error, id, clientIp });
    return NextResponse.json(errorResponse("ロールの更新に失敗しました"), {
      status: 500,
    });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/roles/[id] — ロール削除
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const clientIp = getClientIp(request);
  const { id } = await params;

  try {
    await requirePermission("roles", "delete");

    const allowed = await deleteRateLimit(clientIp);
    if (!allowed) {
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    logger.info("Deleting role", { id, clientIp });

    await deleteRole(id);

    logger.info("Role deleted successfully", { id });
    return NextResponse.json(successResponse(null, "ロールを削除しました"));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        errorResponse("認証が必要です", undefined, "UNAUTHORIZED"),
        { status: 401 },
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        errorResponse("この操作を行う権限がありません", undefined, "FORBIDDEN"),
        { status: 403 },
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("ユーザーに割り当てられている")
    ) {
      return NextResponse.json(
        errorResponse(error.message, undefined, "ROLE_IN_USE"),
        { status: 409 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          errorResponse("ロールが見つかりません", undefined, "NOT_FOUND"),
          { status: 404 },
        );
      }
    }
    logger.error("Failed to delete role", { error, id, clientIp });
    return NextResponse.json(errorResponse("ロールの削除に失敗しました"), {
      status: 500,
    });
  }
}
