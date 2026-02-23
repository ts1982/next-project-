"use client"

import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/common/data-table"
import type { Column } from "@/components/common/data-table"
import { formatInTimezone } from "@/lib/utils/timezone"
import type { AdminNotification, NotificationType } from "../types/admin-notification.types"

interface AdminNotificationTableProps {
  notifications: AdminNotification[]
  timezone: string
  onRowClick: (notification: AdminNotification) => void
}

const TYPE_LABELS: Record<NotificationType, string> = {
  SYSTEM: "システム",
  INFO: "お知らせ",
  WARNING: "警告",
  PROMOTION: "キャンペーン",
}

const TYPE_VARIANTS: Record<NotificationType, "default" | "secondary" | "destructive" | "outline"> = {
  SYSTEM: "secondary",
  INFO: "default",
  WARNING: "destructive",
  PROMOTION: "outline",
}

export function AdminNotificationTable({
  notifications,
  timezone,
  onRowClick,
}: AdminNotificationTableProps) {
  const columns: Column<AdminNotification>[] = [
    {
      key: "title",
      header: "タイトル",
      render: (n) => <span className="font-medium">{n.title}</span>,
    },
    {
      key: "type",
      header: "種別",
      render: (n) => (
        <Badge variant={TYPE_VARIANTS[n.type]}>{TYPE_LABELS[n.type]}</Badge>
      ),
    },
    {
      key: "targetType",
      header: "対象",
      render: (n) =>
        n.targetType === "ALL"
          ? "全ユーザー"
          : `特定(${n.targets.length}名)`,
    },
    {
      key: "status",
      header: "ステータス",
      render: (n) => {
        if (n.deliveredAt) return <Badge variant="default">配信済み</Badge>
        if (n.scheduledAt) return <Badge variant="secondary">予約中</Badge>
        return <Badge variant="outline">未配信</Badge>
      },
    },
    {
      key: "scheduledAt",
      header: "配信日時",
      render: (n) =>
        n.deliveredAt
          ? formatInTimezone(n.deliveredAt, timezone, "yyyy/MM/dd HH:mm")
          : n.scheduledAt
          ? formatInTimezone(n.scheduledAt, timezone, "yyyy/MM/dd HH:mm")
          : "-",
    },
    {
      key: "createdAt",
      header: "作成日時",
      render: (n) =>
        formatInTimezone(n.createdAt, timezone, "yyyy/MM/dd HH:mm"),
    },
  ]

  return (
    <DataTable
      data={notifications}
      columns={columns}
      getRowKey={(n) => n.id}
      onRowClick={onRowClick}
      emptyMessage="通知がありません"
      ariaLabel="通知一覧テーブル"
    />
  )
}
