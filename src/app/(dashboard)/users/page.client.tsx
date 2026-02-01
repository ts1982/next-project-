"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Users as UsersIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/common/pagination"
import { UserTable } from "@/features/users/components/user-table"
import { UserSearch } from "@/features/users/components/user-search"
import { UserCreateModal } from "@/features/users/components/user-create-modal"
import type { User } from "@/features/users"

interface UsersClientPageProps {
  initialUsers: User[]
  initialSearch: string
  initialPagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  timezone: string
}

export function UsersClientPage({
  initialUsers,
  initialSearch,
  initialPagination,
  timezone,
}: UsersClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            新規登録
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">登録ユーザーの一覧を表示・管理できます</p>
      </div>

      <UserSearch defaultValue={initialSearch} />

      <div className="space-y-4">
        <UserTable users={initialUsers} pagination={initialPagination} timezone={timezone} />

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

      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
