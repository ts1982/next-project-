import { NextResponse } from "next/server";
import { createStore, getStoreList } from "@/features/stores/services/store.service";
import { createStoreSchema } from "@/features/stores/schemas/store.schema";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { parsePagination } from "@/lib/constants/pagination";

export const GET = withApiHandler(
  async (request, { clientIp }) => {
    await requirePermission("stores", "read");

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const { page } = parsePagination(searchParams);

    const data = await getStoreList(search, page);

    logger.info("Stores fetched successfully", {
      count: data.stores.length,
      page,
      search,
      clientIp,
    });

    return NextResponse.json(successResponse(data));
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "店舗の取得" },
);

export const POST = withApiHandler(
  async (request, { clientIp }) => {
    await requirePermission("stores", "create");

    const body = await request.json();
    const validatedData = createStoreSchema.parse(body);
    const store = await createStore(validatedData);

    logger.info("Store created successfully", { storeId: store.id, clientIp });

    return NextResponse.json(successResponse(store, "店舗を作成しました"), {
      status: 201,
    });
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "店舗の作成" },
);
