// GET /api/users — 通知受信者（User）一覧（読み取り専用）
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { parsePagination } from "@/lib/constants/pagination";

export const GET = withApiHandler(
  async (request) => {
    await requirePermission("notifications", "read");

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const { page, limit } = parsePagination(searchParams);
    const skip = (page - 1) * limit;

    logger.info("Fetching users (receivers)", { search, page, limit });

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

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
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    logger.info("Users (receivers) fetched", { count: users.length, total });
    return NextResponse.json(
      successResponse({
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }),
    );
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "ユーザー一覧の取得" },
);
