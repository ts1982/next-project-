/** 通知種別 */
export type NotificationType = "SYSTEM" | "INFO" | "WARNING" | "PROMOTION";

/** 通知 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  scheduledAt: Date | null;
  createdAt: Date;
}

/** カーソルベースページネーション付き通知一覧レスポンス */
export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}
