import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { rateLimit, type RateLimitConfig } from "@/lib/middleware/rate-limit";
import { getClientIp } from "@/lib/utils/request";

export interface ApiHandlerContext {
  clientIp: string;
  params: Record<string, string>;
}

interface ApiHandlerOptions {
  rateLimit: RateLimitConfig;
  operationName: string;
}

type ApiHandler = (request: NextRequest, context: ApiHandlerContext) => Promise<NextResponse>;

export function withApiHandler(handler: ApiHandler, options: ApiHandlerOptions) {
  const rateLimiter = rateLimit(options.rateLimit);

  return async (
    request: NextRequest,
    routeContext?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const clientIp = getClientIp(request);
    const params = routeContext?.params ? await routeContext.params : {};

    try {
      const allowed = await rateLimiter(clientIp);
      if (!allowed) {
        logger.warn("Rate limit exceeded", {
          clientIp,
          method: request.method,
          path: request.nextUrl.pathname,
        });
        return NextResponse.json(
          errorResponse(
            "レート制限を超えました。しばらく待ってから再試行してください。",
            undefined,
            "RATE_LIMIT_EXCEEDED",
          ),
          { status: 429 },
        );
      }

      return await handler(request, { clientIp, params });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(errorResponse("認証が必要です", undefined, "UNAUTHORIZED"), {
          status: 401,
        });
      }

      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          errorResponse("この操作を行う権限がありません", undefined, "FORBIDDEN"),
          { status: 403 },
        );
      }

      if (error instanceof ZodError || (error instanceof Error && error.name === "ZodError")) {
        const zodErr = error as ZodError;
        const fieldErrors: Record<string, string> = {};
        zodErr.issues.forEach((err) => {
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
            errorResponse("この値は既に使用されています", undefined, "DUPLICATE_VALUE"),
            { status: 409 },
          );
        }
        if (error.code === "P2025") {
          return NextResponse.json(
            errorResponse("対象のリソースが見つかりません", undefined, "NOT_FOUND"),
            { status: 404 },
          );
        }
      }

      if (error instanceof Prisma.PrismaClientInitializationError) {
        logger.error("Database connection failed", { error, clientIp });
        return NextResponse.json(
          errorResponse(
            "データベースに接続できません。しばらく待ってから再試行してください。",
            undefined,
            "DATABASE_CONNECTION_ERROR",
          ),
          { status: 503 },
        );
      }

      if (error instanceof Error && error.message.includes("ユーザーに割り当てられている")) {
        return NextResponse.json(errorResponse(error.message, undefined, "ROLE_IN_USE"), {
          status: 409,
        });
      }

      logger.error(`Failed: ${options.operationName}`, { error, clientIp });
      return NextResponse.json(errorResponse(`${options.operationName}に失敗しました`), {
        status: 500,
      });
    }
  };
}
