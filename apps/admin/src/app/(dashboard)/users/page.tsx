// 通知受信者（User）閲覧専用ページ
import { prisma } from "@/lib/db/prisma";
import { PAGINATION } from "@/lib/constants/pagination";
import { UsersReceiverClientPage } from "./page.client";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

const UsersReceiverPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || String(PAGINATION.DEFAULT_PAGE));
  const limit = PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

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

  return (
    <UsersReceiverClientPage
      initialUsers={users}
      initialSearch={search}
      initialPagination={{
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }}
    />
  );
};

export default UsersReceiverPage;
