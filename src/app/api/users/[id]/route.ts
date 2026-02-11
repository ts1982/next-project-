import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { updateUser } from "@/features/users/services/user.service";
import { prisma } from "@/lib/db/prisma";
import { errorResponse, successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import {
  requirePermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/guards";

const patchRateLimit = rateLimit(RATE_LIMITS.POST);
const deleteRateLimit = rateLimit(RATE_LIMITS.STRICT);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const clientIp = getClientIp(request);
  const { id } = await params;

  try {
    // ユーザー更新権限チェック（scope: "own" なら自己リソースのみ）
    await requirePermission("users", "update", id);

    const allowed = await patchRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp, method: "PATCH" });
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
    logger.info("Updating user", { id, clientIp });

    const result = await updateUser(id, body);

    logger.info("User updated successfully", { id });
    return NextResponse.json(
      successResponse(result, "ユーザーを更新しました"),
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn("Unauthorized access", { id, clientIp });
      return NextResponse.json(
        errorResponse("認証が必要です", undefined, "UNAUTHORIZED"),
        { status: 401 },
      );
    }
    if (error instanceof ForbiddenError) {
      logger.warn("Forbidden access", { id, clientIp });
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
        logger.warn("Duplicate email", { id, clientIp });
        return NextResponse.json(
          errorResponse(
            "このメールアドレスは既に使用されています",
            undefined,
            "DUPLICATE_EMAIL",
          ),
          { status: 409 },
        );
      }
      if (error.code === "P2025") {
        logger.warn("User not found", { id, clientIp });
        return NextResponse.json(
          errorResponse("ユーザーが見つかりません", undefined, "NOT_FOUND"),
          { status: 404 },
        );
      }
    }

    logger.error("Failed to update user", { error, id, clientIp });
    return NextResponse.json(errorResponse("ユーザーの更新に失敗しました"), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const clientIp = getClientIp(request);
  const { id } = await params;

  try {
    // ユーザー削除権限チェック
    await requirePermission("users", "delete", id);

    const allowed = await deleteRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp, method: "DELETE" });
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    logger.info("Deleting user", { id, clientIp });

    await prisma.user.delete({
      where: { id },
    });

    logger.info("User deleted successfully", { id });
    return NextResponse.json(successResponse(null, "ユーザーを削除しました"), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn("Unauthorized access", { id, clientIp });
      return NextResponse.json(
        errorResponse("認証が必要です", undefined, "UNAUTHORIZED"),
        { status: 401 },
      );
    }
    if (error instanceof ForbiddenError) {
      logger.warn("Forbidden access", { id, clientIp });
      return NextResponse.json(
        errorResponse("この操作を行う権限がありません", undefined, "FORBIDDEN"),
        { status: 403 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        logger.warn("User not found", { id, clientIp });
        return NextResponse.json(
          errorResponse("ユーザーが見つかりません", undefined, "NOT_FOUND"),
          { status: 404 },
        );
      }
    }

    logger.error("Failed to delete user", { error, id, clientIp });
    return NextResponse.json(errorResponse("ユーザーの削除に失敗しました"), {
      status: 500,
    });
  }
}
