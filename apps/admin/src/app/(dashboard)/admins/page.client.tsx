"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users as UsersIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/common/pagination";
import { AdminTable } from "@/features/admins/components/admin-table";
import { AdminSearch } from "@/features/admins/components/admin-search";
import { AdminCreateModal } from "@/features/admins/components/admin-create-modal";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type { Admin } from "@/features/admins";

interface AdminsClientPageProps {
  initialAdmins: Admin[];
  initialSearch: string;
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timezone: string;
}

export function AdminsClientPage({
  initialAdmins,
  initialSearch,
  initialPagination,
  timezone,
}: AdminsClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { can } = usePermissions();

  const canCreate = can("admins", "create");

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">管理者管理</h1>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              新規登録
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mt-1">登録管理者の一覧を表示・管理できます</p>
      </div>

      <AdminSearch defaultValue={initialSearch} />

      <div className="space-y-4">
        <AdminTable admins={initialAdmins} pagination={initialPagination} timezone={timezone} />

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

      {canCreate && (
        <AdminCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
