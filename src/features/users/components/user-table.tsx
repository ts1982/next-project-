"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { DataTable, type Column } from "@/components/common/data-table"
import { usePagination } from "@/lib/hooks"
import { UserDetailModal } from "./user-detail-modal"
import type { User } from "../types/user.types"

interface UserTableProps {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const UserTable = ({ users, pagination }: UserTableProps) => {
  const { goToPage, isPending } = usePagination()
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
      key: "createdAt",
      header: "登録日",
      render: (user) =>
        format(user.createdAt, "yyyy/MM/dd HH:mm", { locale: ja }),
    },
    {
      key: "updatedAt",
      header: "更新日",
      render: (user) =>
        format(user.updatedAt, "yyyy/MM/dd HH:mm", { locale: ja }),
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
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: goToPage,
        }}
        isLoading={isPending}
        ariaLabel="ユーザー一覧テーブル"
      />

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </>
  )
}
