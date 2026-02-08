import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createUserSchema } from "@/features/users/schemas/user.schema";
import { createUser } from "@/features/users/services/user.service";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

// Rate limiters
const getRateLimit = rateLimit(RATE_LIMITS.GET);
const postRateLimit = rateLimit(RATE_LIMITS.POST);

// クライアントIPを取得する関数
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const allowed = await getRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp, method: "GET" });
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED"
        ),
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    logger.info("Fetching users", { search, page, limit, clientIp });

    // 検索条件
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // 総数とデータを並行取得（パスワードを除外）
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          // passwordは除外
        },
      }),
    ]);

    const response = {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    logger.info("Users fetched successfully", { count: users.length, total });
    return NextResponse.json(successResponse(response));
  } catch (error) {
    logger.error("Failed to fetch users", { error, clientIp });
    return NextResponse.json(errorResponse("ユーザーの取得に失敗しました"), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const allowed = await postRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp, method: "POST" });
      return NextResponse.json(
        errorResponse(
          "レート制限を超えました。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED"
        ),
        { status: 429 }
      );
    }

    const body = await request.json();

    logger.info("Creating user", { email: body.email, clientIp });

    // zodでバリデーション
    const validatedData = createUserSchema.parse(body);

    // ユーザー作成
    const result = await createUser(validatedData);

    logger.info("User created successfully", { user: result });
    return NextResponse.json(
      successResponse(result, "ユーザーが正常に作成されました"),
      { status: 201 }
    );
  } catch (error) {
    // zodバリデーションエラー
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
        { status: 400 }
      );
    }

    // 重複エラー（メールアドレス）
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        logger.warn("Duplicate email", { clientIp });
        return NextResponse.json(
          errorResponse(
            "このメールアドレスは既に使用されています",
            undefined,
            "DUPLICATE_EMAIL"
          ),
          { status: 409 }
        );
      }
    }

    logger.error("Failed to create user", { error, clientIp });
    return NextResponse.json(errorResponse("ユーザーの作成に失敗しました"), {
      status: 500,
    });
  }
}
