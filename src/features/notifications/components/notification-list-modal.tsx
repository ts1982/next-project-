"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Info, AlertTriangle, Megaphone, Settings, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils/date-format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Notification,
  NotificationType,
  NotificationListResponse,
} from "../types/notification.types";

interface NotificationListModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  timezone: string;
}

/** 通知種別ごとのアイコン */
const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  SYSTEM: <Settings className="h-4 w-4 text-slate-500" />,
  INFO: <Info className="h-4 w-4 text-blue-500" />,
  WARNING: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  PROMOTION: <Megaphone className="h-4 w-4 text-green-500" />,
};

/** 通知種別ごとのバッジバリアント */
const TYPE_LABEL: Record<NotificationType, string> = {
  SYSTEM: "システム",
  INFO: "お知らせ",
  WARNING: "警告",
  PROMOTION: "キャンペーン",
};

const TYPE_BADGE_CLASS: Record<NotificationType, string> = {
  SYSTEM: "bg-slate-100 text-slate-700 border-slate-200",
  INFO: "bg-blue-100 text-blue-700 border-blue-200",
  WARNING: "bg-amber-100 text-amber-700 border-amber-200",
  PROMOTION: "bg-green-100 text-green-700 border-green-200",
};

const LIMIT = 20;

export function NotificationListModal({
  userId,
  isOpen,
  onClose,
  timezone,
}: NotificationListModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchNotificationsRef = useRef<((cursor?: string) => Promise<void>) | null>(null);

  const fetchNotifications = useCallback(
    async (cursor?: string) => {
      const isInitial = !cursor;
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({ limit: String(LIMIT) });
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(
          `/api/users/${userId}/notifications?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("通知の取得に失敗しました");
        }

        const json = await response.json();
        const data = json.data as NotificationListResponse;

        if (isInitial) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setNextCursor(data.pagination.nextCursor);
        setHasMore(data.pagination.hasMore);
      } catch (err) {
        console.error(err);
        setError("通知の取得に失敗しました");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId],
  );

  // fetchNotifications の最新の参照を保持
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // モーダルが開かれたときに初回フェッチ
  useEffect(() => {
    if (isOpen) {
      setNotifications([]);
      setNextCursor(null);
      setHasMore(false);
      setError(null);
      setIsLoading(false);
      setIsLoadingMore(false);
      
      // 最新の fetchNotifications を呼び出す
      if (fetchNotificationsRef.current) {
        fetchNotificationsRef.current();
      }
    }
  }, [isOpen]);

  // 無限スクロール用の IntersectionObserver 設定
  useEffect(() => {
    // モーダルが閉じている場合は observer を設定しない
    if (!isOpen) return;
    
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // センチネル要素が表示されたら次ページを読み込む
        if (entries[0].isIntersecting && nextCursor && fetchNotificationsRef.current) {
          fetchNotificationsRef.current(nextCursor);
        }
      },
      {
        root: null, // ビューポートをルートとする
        rootMargin: "100px", // 100px 手前で発火
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [isOpen, hasMore, isLoadingMore, nextCursor]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-150 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知一覧
          </DialogTitle>
          <DialogDescription>
            ユーザーに紐づく通知の一覧です
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {/* ローディング中（初回） */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                読み込み中...
              </span>
            </div>
          )}

          {/* エラー */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotificationsRef.current?.()}
              >
                再試行
              </Button>
            </div>
          )}

          {/* 空状態 */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                通知はありません
              </p>
            </div>
          )}

          {/* 通知リスト */}
          {!isLoading && notifications.length > 0 && (
            <>
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      notification.isRead
                        ? "bg-muted/30 opacity-70"
                        : "bg-background border-l-4 border-l-primary"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {TYPE_ICON[notification.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-sm font-medium ${
                              notification.isRead
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {notification.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              TYPE_BADGE_CLASS[notification.type]
                            }`}
                          >
                            {TYPE_LABEL[notification.type]}
                          </Badge>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatDateTime(notification.createdAt, timezone)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 無限スクロール用センチネル要素 */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        読み込み中...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 全件読み込み済み */}
              {!hasMore && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  すべての通知を表示しました（{notifications.length}件）
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
