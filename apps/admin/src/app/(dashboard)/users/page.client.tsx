"use client";

// 通知受信者（User）閲覧専用ページ
import { useRouter, useSearchParams } from "next/navigation";
import { Users as UsersIcon } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { UserSearch } from "@/features/users/components/user-search";
import { DataTable } from "@/components/common/data-table";
import { formatInTimezone } from "@/lib/utils/timezone";
import type { Column } from "@/components/common/data-table";

interface ReceiverUser {
  id: string;
  name: string;
  email: string;
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UsersReceiverClientPageProps {
  initialUsers: ReceiverUser[];
  initialSearch: string;
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const columns: Column<ReceiverUser>[] = [
  { key: "name", header: "名前", render: (u) => u.name },
  { key: "email", header: "メールアドレス", render: (u) => u.email },
  {
    key: "timezone",
    header: "タイムゾーン",
    render: (u) => u.timezone || "-",
  },
  {
    key: "createdAt",
    header: "登録日時",
    render: (u) => formatInTimezone(u.createdAt, "Asia/Tokyo", "yyyy/MM/dd HH:mm"),
  },
];

export function UsersReceiverClientPage({
  initialUsers,
  initialSearch,
  initialPagination,
}: UsersReceiverClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">ユーザー一覧</h1>
        </div>
        <p className="text-muted-foreground mt-1">通知を受信するユーザーの一覧です（閲覧専用）</p>
      </div>

      <UserSearch defaultValue={initialSearch} />

      <div className="space-y-4">
        <DataTable data={initialUsers} columns={columns} getRowKey={(u) => u.id} />

        {initialPagination.totalPages > 1 && (
          <Pagination
            currentPage={initialPagination.page}
            totalPages={initialPagination.totalPages}
            totalItems={initialPagination.total}
            itemsPerPage={initialPagination.limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
