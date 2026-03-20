"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatInTimezone } from "@/lib/utils/timezone";
import type { AdminNotification, NotificationType } from "../types/admin-notification.types";

interface AdminNotificationDetailModalProps {
  notification: AdminNotification | null;
  timezone: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onEdit: () => void;
}

const TYPE_LABELS: Record<NotificationType, string> = {
  SYSTEM: "システム",
  INFO: "お知らせ",
  WARNING: "警告",
  PROMOTION: "キャンペーン",
};

export function AdminNotificationDetailModal({
  notification,
  timezone,
  isOpen,
  onClose,
  onDeleted,
  onEdit,
}: AdminNotificationDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!notification) return;

    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "削除に失敗しました");
        return;
      }
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!notification) return null;

  const isDelivered = !!notification.deliveredAt;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>通知詳細</DialogTitle>
          <DialogDescription>通知の詳細情報を表示しています。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">タイトル</p>
              <p className="font-medium">{notification.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">本文</p>
              <p className="text-sm whitespace-pre-wrap rounded-md bg-muted/50 p-3">
                {notification.body}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">種別</p>
                <Badge>{TYPE_LABELS[notification.type]}</Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">対象</p>
                <p className="text-sm">
                  {notification.targetType === "ALL"
                    ? "全ユーザー"
                    : `特定 (${notification.targets.length}名)`}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">ステータス</p>
                {isDelivered ? (
                  <Badge variant="default">配信済み</Badge>
                ) : notification.scheduledAt ? (
                  <Badge variant="secondary">予約中</Badge>
                ) : (
                  <Badge variant="outline">未配信</Badge>
                )}
              </div>
            </div>
            {notification.deliveredAt && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">配信日時</p>
                <p className="text-sm">
                  {formatInTimezone(notification.deliveredAt, timezone, "yyyy/MM/dd HH:mm")}
                </p>
              </div>
            )}
            {notification.scheduledAt && !notification.deliveredAt && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">予約日時</p>
                <p className="text-sm">
                  {formatInTimezone(notification.scheduledAt, timezone, "yyyy/MM/dd HH:mm")}
                </p>
              </div>
            )}
            {notification.targetType === "SPECIFIC" && notification.targets.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">送信先ユーザー</p>
                <div className="flex flex-wrap gap-1.5">
                  {notification.targets.map((t) => (
                    <Badge key={t.id} variant="secondary" className="text-xs">
                      {t.user.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">作成者</p>
                <p className="text-sm">{notification.createdBy.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">作成日時</p>
                <p className="text-sm">
                  {formatInTimezone(notification.createdAt, timezone, "yyyy/MM/dd HH:mm")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between border-t pt-4">
            <div className="flex gap-2">
              {!isDelivered && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  編集
                </Button>
              )}
              {!isDelivered && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? "削除中..." : "削除"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>通知を削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>
                        この操作は取り消せません。「{notification.title}」を完全に削除します。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        削除する
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
