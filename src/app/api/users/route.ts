import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createUserSchema } from "@/features/users/schemas/user.schema";
import { createUser } from "@/features/users/services/user.service";
import { successResponse } from "@/lib/types/api.types";
import { logger } from "@/lib/utils/logger";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { requirePermission } from "@/lib/auth/guards";
import { withApiHandler } from "@/lib/middleware/api-handler";

export const GET = withApiHandler(
  async (request, { clientIp }) => {
    const { user: currentUser, scope } = await requirePermission("users", "read");

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    logger.info("Fetching users", { search, page, limit, clientIp });

    const searchWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const where = scope === "own" ? { ...searchWhere, id: currentUser.id } : searchWhere;

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
          roleId: true,
          role: { select: { id: true, name: true } },
          timezone: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
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
  },
  { rateLimit: RATE_LIMITS.GET, operationName: "ユーザーの取得" },
);

export const POST = withApiHandler(
  async (request, { clientIp }) => {
    await requirePermission("users", "create");

    const body = await request.json();
    logger.info("Creating user", { email: body.email, clientIp });

    const validatedData = createUserSchema.parse(body);
    const result = await createUser(validatedData);

    logger.info("User created successfully", { user: result });
    return NextResponse.json(successResponse(result, "ユーザーが正常に作成されました"), {
      status: 201,
    });
  },
  { rateLimit: RATE_LIMITS.POST, operationName: "ユーザーの作成" },
);
