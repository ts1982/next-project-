import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createAdminSchema } from "@/features/admins/schemas/admin.schema";
import { createAdmin } from "@/features/admins/services/admin.service";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { parsePagination } from "@/lib/constants/pagination";

export const GET = withApiHandler(
  async (request, { clientIp }) => {
    const { user: currentUser, scope } = await requirePermission("admins", "read");

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const { page, limit } = parsePagination(searchParams);
    const skip = (page - 1) * limit;

    logger.info("Fetching admins", { search, page, limit, clientIp });

    const searchWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const where = scope === "own" ? { ...searchWhere, id: currentUser.id } : searchWhere;

    const [total, admins] = await Promise.all([
      prisma.admin.count({ where }),
      prisma.admin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          roleId: true,
          role: { select: { id: true, name: true } },
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const response = {
      admins,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    logger.info("Admins fetched successfully", { count: admins.length, total });
    return NextResponse.json(successResponse(response));
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "管理者の取得" },
);

export const POST = withApiHandler(
  async (request, { clientIp }) => {
    await requirePermission("admins", "create");

    const body = await request.json();
    logger.info("Creating admin", { email: body.email, clientIp });

    const validatedData = createAdminSchema.parse(body);
    const result = await createAdmin(validatedData);

    logger.info("Admin created successfully", { admin: result });
    return NextResponse.json(successResponse(result, "管理者が正常に作成されました"), {
      status: 201,
    });
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "管理者の作成" },
);
