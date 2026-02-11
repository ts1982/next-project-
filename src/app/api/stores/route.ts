import { NextRequest, NextResponse } from "next/server";
import {
  createStore,
  getStoreList,
} from "@/features/stores/services/store.service";
import { createStoreSchema } from "@/features/stores/schemas/store.schema";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import {
  requirePermission,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/guards";

// Rate limiters
const getRateLimit = rateLimit(RATE_LIMITS.GET);
const postRateLimit = rateLimit(RATE_LIMITS.POST);

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // 店舗閲覧権限チェック
    await requirePermission("stores", "read");

    // Rate limiting
    const allowed = await getRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded for GET /api/stores", { clientIp });
      return NextResponse.json(
        errorResponse(
          "リクエストが多すぎます。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");

    const data = await getStoreList(search, page);

    logger.info("Stores fetched successfully", {
      count: data.stores.length,
      page,
      search,
      clientIp,
    });

    return NextResponse.json(successResponse(data));
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
    logger.error("Failed to fetch stores", { error, clientIp });
    return NextResponse.json(errorResponse("店舗の取得に失敗しました"), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // 店舗作成権限チェック
    await requirePermission("stores", "create");

    // Rate limiting
    const allowed = await postRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded for POST /api/stores", { clientIp });
      return NextResponse.json(
        errorResponse(
          "リクエストが多すぎます。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    const body = await request.json();

    // バリデーション
    const result = createStoreSchema.safeParse(body);
    if (!result.success) {
      logger.warn("Validation failed for store creation", {
        errors: result.error.issues,
        clientIp,
      });
      return NextResponse.json(
        errorResponse("入力データが不正です", {
          details: JSON.stringify(result.error.issues),
        }),
        { status: 400 },
      );
    }

    const store = await createStore(result.data);

    logger.info("Store created successfully", { storeId: store.id, clientIp });

    return NextResponse.json(successResponse(store, "店舗を作成しました"), {
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
    logger.error("Failed to create store", { error, clientIp });
    return NextResponse.json(errorResponse("店舗の作成に失敗しました"), {
      status: 500,
    });
  }
}
