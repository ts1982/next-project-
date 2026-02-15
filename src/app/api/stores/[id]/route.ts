import { NextResponse } from "next/server";
import {
  getStoreById,
  updateStore,
  deleteStore,
} from "@/features/stores/services/store.service";
import { updateStoreSchema } from "@/features/stores/schemas/store.schema";
import { successResponse, errorResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const GET = withApiHandler(
  async (request, { clientIp, params }) => {
    await requirePermission("stores", "read");

    const storeId = parseInt(params.id);
    if (isNaN(storeId)) {
      logger.warn("Invalid store ID", { id: params.id, clientIp });
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
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "店舗の取得" },
);

export const PATCH = withApiHandler(
  async (request, { clientIp, params }) => {
    await requirePermission("stores", "update");

    const storeId = parseInt(params.id);
    if (isNaN(storeId)) {
      logger.warn("Invalid store ID", { id: params.id, clientIp });
      return NextResponse.json(errorResponse("無効なIDです"), { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateStoreSchema.parse(body);
    const store = await updateStore(storeId, validatedData);

    logger.info("Store updated successfully", { storeId, clientIp });
    return NextResponse.json(successResponse(store, "店舗を更新しました"));
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "店舗の更新" },
);

export const DELETE = withApiHandler(
  async (request, { clientIp, params }) => {
    await requirePermission("stores", "delete");

    const storeId = parseInt(params.id);
    if (isNaN(storeId)) {
      logger.warn("Invalid store ID", { id: params.id, clientIp });
      return NextResponse.json(errorResponse("無効なIDです"), { status: 400 });
    }

    await deleteStore(storeId);

    logger.info("Store deleted successfully", { storeId, clientIp });
    return NextResponse.json(
      successResponse({ id: storeId }, "店舗を削除しました"),
    );
  },
  { rateLimit: RATE_LIMITS.STRICT, operationName: "店舗の削除" },
);
