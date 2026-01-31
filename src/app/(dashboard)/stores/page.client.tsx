"use client"

import { useState } from "react"
import { Store as StoreIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StoreTable, StoreSearch, StoreCreateModal } from "@/features/stores"
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
}

export function StoresClientPage({
  initialStores,
  initialSearch,
  initialPagination,
}: StoresClientPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">店舗管理</h1>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            新規登録
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">登録店舗の一覧を表示・管理できます</p>
      </div>

      <StoreSearch defaultValue={initialSearch} />

      <div className="space-y-4">
        <StoreTable stores={initialStores} />

        {initialPagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">
              {initialPagination.total} 件中 {(initialPagination.page - 1) * initialPagination.pageSize + 1} -{" "}
              {Math.min(initialPagination.page * initialPagination.pageSize, initialPagination.total)} 件を表示
            </p>
          </div>
        )}
      </div>

      <StoreCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}
