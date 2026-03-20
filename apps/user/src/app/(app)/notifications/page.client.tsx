"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Bell, BellRing, BellOff, CheckCheck } from "lucide-react";
import type { Notification } from "@/features/notifications/types/notification.types";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { usePushNotification } from "@/lib/hooks/use-push-notification";

type NotificationType = Notification["type"];

const TYPE_COLORS: Record<NotificationType, string> = {
  SYSTEM: "bg-gray-100 text-gray-700",
  INFO: "bg-blue-100 text-blue-700",
  WARNING: "bg-yellow-100 text-yellow-700",
  PROMOTION: "bg-green-100 text-green-700",
};

const TYPE_LABELS: Record<NotificationType, string> = {
  SYSTEM: "システム",
  INFO: "お知らせ",
  WARNING: "警告",
  PROMOTION: "キャンペーン",
};

interface NotificationsClientPageProps {
  initialNotifications: Notification[];
  initialPagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  initialUnreadCount: number;
}

export function NotificationsClientPage({
  initialNotifications,
  initialPagination,
  initialUnreadCount,
}: NotificationsClientPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [pagination, setPagination] = useState(initialPagination);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleNewNotification = useCallback(
    async (
      wsNotification: { id: string; title: string; body: string; type: string } | undefined,
    ) => {
      if (!wsNotification) return;
      // API から最新1件を取得して正確なデータを表示
      try {
        const res = await fetch("/api/notifications?limit=1");
        if (!res.ok) return;
        const data = await res.json();
        const latest = data.data?.notifications?.[0] as Notification | undefined;
        if (!latest) return;

        setNotifications((prev) => {
          // 重複チェック
          if (prev.some((n) => n.id === latest.id)) return prev;
          return [latest, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      } catch {
        // フォールバック: WebSocket のデータをそのまま使用
        setNotifications((prev) => {
          if (prev.some((n) => n.adminNotificationId === wsNotification.id)) return prev;
          const fallback: Notification = {
            id: crypto.randomUUID(),
            userId: "",
            adminNotificationId: wsNotification.id,
            title: wsNotification.title,
            body: wsNotification.body,
            type: wsNotification.type as Notification["type"],
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return [fallback, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      }
    },
    [],
  );

  const { status: wsStatus } = useWebSocket({
    onNotification: handleNewNotification,
  });

  const {
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
  } = usePushNotification();

  const handleMarkAsRead = useCallback(async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } finally {
      setIsMarkingAll(false);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!pagination.hasMore || !pagination.nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/notifications?cursor=${pagination.nextCursor}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => [...prev, ...data.data.notifications]);
        setPagination(data.data.pagination);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [pagination]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pagination.hasMore, isLoadingMore, handleLoadMore]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">通知</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              wsStatus === "connected"
                ? "bg-green-500"
                : wsStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-gray-300"
            }`}
            title={
              wsStatus === "connected"
                ? "リアルタイム接続中"
                : wsStatus === "connecting"
                  ? "接続中..."
                  : "未接続"
            }
          />
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            {isMarkingAll ? "処理中..." : "すべて既読"}
          </button>
        )}
      </div>

      {/* Web Push 通知バナー */}
      {pushPermission !== "unsupported" && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {isPushSubscribed ? (
              <BellRing className="h-4 w-4 text-blue-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            )}
            <div>
              <span>
                {pushPermission === "denied"
                  ? "プッシュ通知はブラウザ設定でブロックされています"
                  : isPushSubscribed
                    ? "プッシュ通知: ON"
                    : "プッシュ通知を有効にすると、ブラウザを閉じていても通知を受け取れます"}
              </span>
              {pushError && <p className="text-xs text-red-500 mt-1">{pushError}</p>}
            </div>
          </div>
          {pushPermission !== "denied" && (
            <button
              onClick={isPushSubscribed ? pushUnsubscribe : pushSubscribe}
              disabled={isPushLoading}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50 ${
                isPushSubscribed
                  ? "text-gray-600 border border-gray-300 hover:bg-gray-50"
                  : "text-white bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPushLoading ? "処理中..." : isPushSubscribed ? "無効にする" : "有効にする"}
            </button>
          )}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>通知はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 bg-white rounded-lg border transition-colors ${
                !notification.isRead ? "border-blue-200 shadow-sm" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_COLORS[notification.type]}`}
                    >
                      {TYPE_LABELS[notification.type]}
                    </span>
                    {!notification.isRead && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <h3
                    className={`font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-600"}`}
                  >
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {notification.body}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1"
                  >
                    既読
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.hasMore && (
        <>
          <div ref={sentinelRef} className="h-1" />
          {isLoadingMore && (
            <div className="text-center py-4 text-sm text-gray-500">読み込み中...</div>
          )}
        </>
      )}
    </div>
  );
}
