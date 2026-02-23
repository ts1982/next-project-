"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/common/pagination"
import { AdminNotificationTable } from "@/features/notifications/components/admin-notification-table"
import { AdminNotificationCreateModal } from "@/features/notifications/components/admin-notification-create-modal"
import { AdminNotificationDetailModal } from "@/features/notifications/components/admin-notification-detail-modal"
import { AdminNotificationEditModal } from "@/features/notifications/components/admin-notification-edit-modal"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { AdminNotification } from "@/features/notifications/types/admin-notification.types"

interface NotificationsClientPageProps {
  initialNotifications: AdminNotification[]
  initialPagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  timezone: string
}

export function NotificationsClientPage({
  initialNotifications,
  initialPagination,
  timezone,
}: NotificationsClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null)
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null)
  const { can } = usePermissions()

  const canCreate = can("notifications", "create")

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", String(newPage))
      router.push(`?${params.toString()}`)
    },
    [router, searchParams],
  )

  const handleCreated = useCallback(() => {
    router.refresh()
  }, [router])

  const handleDeleted = useCallback(() => {
    router.refresh()
  }, [router])

  const handleUpdated = useCallback(() => {
    router.refresh()
  }, [router])

  const handleEditClick = useCallback(() => {
    setEditingNotification(selectedNotification)
    setSelectedNotification(null)
  }, [selectedNotification])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">通知管理</h1>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              通知を作成
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          ユーザーへの通知を作成・管理できます
        </p>
      </div>

      <div className="space-y-4">
        <AdminNotificationTable
          notifications={initialNotifications}
          timezone={timezone}
          onRowClick={setSelectedNotification}
        />

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
        <AdminNotificationCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleCreated}
          timezone={timezone}
        />
      )}

      <AdminNotificationDetailModal
        notification={selectedNotification}
        timezone={timezone}
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onDeleted={handleDeleted}
        onEdit={handleEditClick}
      />

      <AdminNotificationEditModal
        notification={editingNotification}
        isOpen={!!editingNotification}
        onClose={() => setEditingNotification(null)}
        onUpdated={handleUpdated}
        timezone={timezone}
      />
    </div>
  )
}
