import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import type { UserListResponse } from "@/lib/types/user";

export const getUserList = async (
  search: string,
  page: number
): Promise<UserListResponse> => {
  const limit = PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
