"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Store as StoreIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react"
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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`/stores?${params.toString()}`)
  }

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
        <StoreTable stores={initialStores} timezone={timezone} />

        {initialPagination.totalPages > 1 && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(initialPagination.page - 1)}
                disabled={initialPagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                前へ
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: initialPagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === initialPagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="min-w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(initialPagination.page + 1)}
                disabled={initialPagination.page >= initialPagination.totalPages}
              >
                次へ
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {initialPagination.total} 件中 {(initialPagination.page - 1) * initialPagination.pageSize + 1} -{" "}
              {Math.min(initialPagination.page * initialPagination.pageSize, initialPagination.total)} 件を表示
            </p>
          </div>
        )}
      </div>

      <StoreCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        timezone={timezone}
      />
    </div>
  )
}
