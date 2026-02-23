export type NotificationType = "SYSTEM" | "INFO" | "WARNING" | "PROMOTION";

export interface Notification {
  id: string;
  userId: string;
  adminNotificationId: string | null;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}
