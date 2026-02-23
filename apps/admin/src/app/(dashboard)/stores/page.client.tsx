"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Store as StoreIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/common/pagination"
import { StoreTable } from "@/features/stores/components/store-table"
import { StoreSearch } from "@/features/stores/components/store-search"
import { StoreCreateModal } from "@/features/stores/components/store-create-modal"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { Store } from "@/features/stores"

interface StoresClientPageProps {
  initialStores: Store[]
  initialSearch: string
  initialPagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  timezone: string
}

export function StoresClientPage({
  initialStores,
  initialSearch,
  initialPagination,
  timezone,
}: StoresClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { can } = usePermissions()

  const canCreate = can("stores", "create")

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
            <StoreIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">店舗管理</h1>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              新規登録
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mt-1">登録店舗の一覧を表示・管理できます</p>
      </div>

      <StoreSearch defaultValue={initialSearch} />

      <div className="space-y-4">
        <StoreTable stores={initialStores} timezone={timezone} />

        {initialPagination.totalPages > 1 && (
          <Pagination
            currentPage={initialPagination.page}
            totalPages={initialPagination.totalPages}
            totalItems={initialPagination.total}
            itemsPerPage={initialPagination.pageSize}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {canCreate && (
        <StoreCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          timezone={timezone}
        />
      )}
    </div>
  )
}
