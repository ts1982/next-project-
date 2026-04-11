import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/types/api.types";

export interface ApiHandlerContext {
  params: Record<string, string>;
}

type ApiHandler = (request: NextRequest, context: ApiHandlerContext) => Promise<NextResponse>;

export function withApiHandler(handler: ApiHandler) {
  return async (
    request: NextRequest,
    routeContext?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const params = routeContext?.params ? await routeContext.params : {};

    try {
      return await handler(request, { params });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(errorResponse("認証が必要です", undefined, "UNAUTHORIZED"), {
          status: 401,
        });
      }

      if (error instanceof ForbiddenError) {
        return NextResponse.json(errorResponse("権限がありません", undefined, "FORBIDDEN"), {
          status: 403,
        });
      }

      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        return NextResponse.json(
          errorResponse("バリデーションエラー", fieldErrors, "VALIDATION_ERROR"),
          { status: 400 },
        );
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return NextResponse.json(
            errorResponse("対象のリソースが見つかりません", undefined, "NOT_FOUND"),
            { status: 404 },
          );
        }
      }

      console.error("API Error:", error);
      return NextResponse.json(errorResponse("サーバーエラーが発生しました"), { status: 500 });
    }
  };
}
