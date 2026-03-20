"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/utils/date-format";
import { DataTable, type Column } from "@/components/common/data-table";
import { AdminDetailModal } from "./admin-detail-modal";
import { RoleBadge } from "./role-badge";
import type { Admin } from "../types/admin.types";

interface AdminTableProps {
  admins: Admin[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timezone: string;
}

export const AdminTable = ({ admins, timezone }: AdminTableProps) => {
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const columns: Column<Admin>[] = [
    {
      key: "id",
      header: "ID",
      render: (admin) => <span className="font-medium">{admin.id}</span>,
      className: "w-20",
    },
    {
      key: "name",
      header: "名前",
      render: (admin) => admin.name || "-",
    },
    {
      key: "email",
      header: "メールアドレス",
      render: (admin) => admin.email,
    },
    {
      key: "role",
      header: "ロール",
      render: (admin) => <RoleBadge roleName={admin.role.name} />,
      className: "w-32",
    },
    {
      key: "createdAt",
      header: "登録日",
      render: (admin) => formatDateTime(admin.createdAt, timezone),
    },
    {
      key: "updatedAt",
      header: "更新日",
      render: (admin) => formatDateTime(admin.updatedAt, timezone),
    },
  ];

  return (
    <>
      <DataTable
        data={admins}
        columns={columns}
        getRowKey={(admin) => admin.id}
        onRowClick={handleRowClick}
        emptyMessage="ユーザーが見つかりませんでした"
        ariaLabel="ユーザー一覧テーブル"
      />

      <AdminDetailModal
        admin={selectedAdmin}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAdmin(null);
        }}
        timezone={timezone}
      />
    </>
  );
};
