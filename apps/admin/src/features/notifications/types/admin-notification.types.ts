export type NotificationType = "SYSTEM" | "INFO" | "WARNING" | "PROMOTION";
export type NotificationTargetType = "ALL" | "SPECIFIC";

export interface AdminNotificationTarget {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminNotification {
  id: string;
  createdByAdminId: string;
  title: string;
  body: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  scheduledAt: Date | null;
  schedulerName: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  targets: AdminNotificationTarget[];
  _count?: {
    notifications: number;
  };
}

export interface AdminNotificationListResponse {
  notifications: AdminNotification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateAdminNotificationResponse {
  notification: AdminNotification;
}

export interface UpdateAdminNotificationResponse {
  notification: AdminNotification;
}

export interface DeliverNotificationsResponse {
  delivered: number;
}
