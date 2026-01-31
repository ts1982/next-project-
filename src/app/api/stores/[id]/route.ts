import { NextRequest, NextResponse } from "next/server";
import {
  getStoreById,
  updateStore,
  deleteStore,
} from "@/features/stores/services/store.service";
import { updateStoreSchema } from "@/features/stores/schemas/store.schema";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

// Rate limiters
const getRateLimit = rateLimit(RATE_LIMITS.GET);
const updateRateLimit = rateLimit(RATE_LIMITS.POST);
const deleteRateLimit = rateLimit(RATE_LIMITS.STRICT);

// クライアントIPを取得する関数
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const allowed = await getRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded for GET /api/stores/[id]", { clientIp });
      return NextResponse.json(
        errorResponse(
          "リクエストが多すぎます。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    const { id } = await params;
    const storeId = parseInt(id);

    if (isNaN(storeId)) {
      logger.warn("Invalid store ID", { id, clientIp });
      return NextResponse.json(errorResponse("無効なIDです"), { status: 400 });
    }

    const store = await getStoreById(storeId);

    if (!store) {
      logger.warn("Store not found", { storeId, clientIp });
      return NextResponse.json(errorResponse("店舗が見つかりません"), {
        status: 404,
      });
    }

    logger.info("Store fetched successfully", { storeId, clientIp });

    return NextResponse.json(successResponse(store));
  } catch (error) {
    logger.error("Failed to fetch store", { error, clientIp });
    return NextResponse.json(errorResponse("店舗の取得に失敗しました"), {
      status: 500,
    });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const allowed = await updateRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded for PATCH /api/stores/[id]", {
        clientIp,
      });
      return NextResponse.json(
        errorResponse(
          "リクエストが多すぎます。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    const { id } = await params;
    const storeId = parseInt(id);

    if (isNaN(storeId)) {
      logger.warn("Invalid store ID", { id, clientIp });
      return NextResponse.json(errorResponse("無効なIDです"), { status: 400 });
    }

    const body = await request.json();

    // バリデーション
    const result = updateStoreSchema.safeParse(body);
    if (!result.success) {
      logger.warn("Validation failed for store update", {
        storeId,
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

    const store = await updateStore(storeId, result.data);

    logger.info("Store updated successfully", { storeId, clientIp });

    return NextResponse.json(successResponse(store, "店舗を更新しました"));
  } catch (error) {
    logger.error("Failed to update store", { error, clientIp });
    return NextResponse.json(errorResponse("店舗の更新に失敗しました"), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const allowed = await deleteRateLimit(clientIp);
    if (!allowed) {
      logger.warn("Rate limit exceeded for DELETE /api/stores/[id]", {
        clientIp,
      });
      return NextResponse.json(
        errorResponse(
          "リクエストが多すぎます。しばらく待ってから再試行してください。",
          undefined,
          "RATE_LIMIT_EXCEEDED",
        ),
        { status: 429 },
      );
    }

    const { id } = await params;
    const storeId = parseInt(id);

    if (isNaN(storeId)) {
      logger.warn("Invalid store ID", { id, clientIp });
      return NextResponse.json(errorResponse("無効なIDです"), { status: 400 });
    }

    await deleteStore(storeId);

    logger.info("Store deleted successfully", { storeId, clientIp });

    return NextResponse.json(
      successResponse({ id: storeId }, "店舗を削除しました"),
    );
  } catch (error) {
    logger.error("Failed to delete store", { error, clientIp });
    return NextResponse.json(errorResponse("店舗の削除に失敗しました"), {
      status: 500,
    });
  }
}
