"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { RoleDetailModal } from "./role-detail-modal";
import type { RoleWithPermissions, PermissionDefinition } from "../types/role.types";
import { RESOURCE_LABELS, ACTION_LABELS } from "@/lib/auth/permissions";

interface RoleTableProps {
  roles: RoleWithPermissions[];
  permissions: PermissionDefinition[];
}

export function RoleTable({ roles, permissions }: RoleTableProps) {
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const columns: Column<RoleWithPermissions>[] = [
    {
      key: "name",
      header: "ロール名",
      render: (role) => (
        <span className="font-medium">
          {role.name}
          {role.isSystem && (
            <Badge variant="outline" className="ml-2 text-xs">
              システム
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: "description",
      header: "説明",
      render: (role) => <span className="text-muted-foreground">{role.description || "—"}</span>,
      hideBelow: "md",
    },
    {
      key: "permissions",
      header: "パーミッション数",
      render: (role) => <Badge variant="secondary">{role.permissions.length}</Badge>,
    },
    {
      key: "summary",
      header: "権限概要",
      hideBelow: "md",
      render: (role) => {
        const summary = role.permissions
          .slice(0, 3)
          .map(
            (p) =>
              `${RESOURCE_LABELS[p.resource as keyof typeof RESOURCE_LABELS] || p.resource}:${
                ACTION_LABELS[p.action as keyof typeof ACTION_LABELS] || p.action
              }`,
          );
        const remaining = role.permissions.length - 3;
        return (
          <span className="text-xs text-muted-foreground">
            {summary.join(", ")}
            {remaining > 0 && ` +${remaining}`}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        data={roles}
        columns={columns}
        getRowKey={(role) => role.id}
        onRowClick={handleRowClick}
        emptyMessage="ロールが見つかりませんでした"
        ariaLabel="ロール一覧テーブル"
      />

      <RoleDetailModal
        role={selectedRole}
        permissions={permissions}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRole(null);
        }}
      />
    </>
  );
}
