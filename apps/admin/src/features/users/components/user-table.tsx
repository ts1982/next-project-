"use client"

import { useState } from "react"
import { formatDateTime } from "@/lib/utils/date-format"
import { DataTable, type Column } from "@/components/common/data-table"
import { UserDetailModal } from "./user-detail-modal"
import { RoleBadge } from "./role-badge"
import type { User } from "../types/user.types"

interface UserTableProps {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  timezone: string
}

export const UserTable = ({ users, timezone }: UserTableProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRowClick = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const columns: Column<User>[] = [
    {
      key: "id",
      header: "ID",
      render: (user) => <span className="font-medium">{user.id}</span>,
      className: "w-20",
    },
    {
      key: "name",
      header: "名前",
      render: (user) => user.name || "-",
    },
    {
      key: "email",
      header: "メールアドレス",
      render: (user) => user.email,
    },
    {
      key: "role",
      header: "ロール",
      render: (user) => <RoleBadge roleName={user.role.name} />,
      className: "w-32",
    },
    {
      key: "createdAt",
      header: "登録日",
      render: (user) => formatDateTime(user.createdAt, timezone),
    },
    {
      key: "updatedAt",
      header: "更新日",
      render: (user) => formatDateTime(user.updatedAt, timezone),
    },
  ]

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        getRowKey={(user) => user.id}
        onRowClick={handleRowClick}
        emptyMessage="ユーザーが見つかりませんでした"
        ariaLabel="ユーザー一覧テーブル"
      />

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
        timezone={timezone}
      />
    </>
  )
}
