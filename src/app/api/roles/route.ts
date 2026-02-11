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
  getRoleList,
  createRole,
  getAllPermissions,
} from "@/features/roles/services/role.service";
import { createRoleSchema } from "@/features/roles/schemas/role.schema";

const getRateLimit = rateLimit(RATE_LIMITS.GET);
const postRateLimit = rateLimit(RATE_LIMITS.POST);

// ---------------------------------------------------------------------------
// GET /api/roles — ロール一覧 + 全パーミッション定義
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    await requirePermission("roles", "read");

    const allowed = await getRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp, method: "GET" });
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    logger.info("Fetching roles", { clientIp });

    const [roleList, permissions] = await Promise.all([
      getRoleList(),
      getAllPermissions(),
    ]);

    return NextResponse.json(successResponse({ ...roleList, permissions }));
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
    logger.error("Failed to fetch roles", { error, clientIp });
    return NextResponse.json(errorResponse("ロール一覧の取得に失敗しました"), {
      status: 500,
    });
  }
}

// ---------------------------------------------------------------------------
// POST /api/roles — ロール作成
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    await requirePermission("roles", "create");

    const allowed = await postRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp, method: "POST" });
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
    const validated = createRoleSchema.parse(body);

    logger.info("Creating role", { name: validated.name, clientIp });

    const role = await createRole(validated);

    logger.info("Role created successfully", { id: role.id, name: role.name });
    return NextResponse.json(successResponse(role, "ロールを作成しました"), {
      status: 201,
    });
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
    }
    logger.error("Failed to create role", { error, clientIp });
    return NextResponse.json(errorResponse("ロールの作成に失敗しました"), {
      status: 500,
    });
  }
}
