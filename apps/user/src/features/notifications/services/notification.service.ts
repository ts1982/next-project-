import { prisma } from "@/lib/db/prisma";
import type {
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/notification.types";

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  adminNotificationId: true,
  title: true,
  body: true,
  type: true,
  isRead: true,
  createdAt: true,
  updatedAt: true,
} as const;

const DEFAULT_LIMIT = 20;

export async function getNotificationsByUserId(
  userId: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
): Promise<NotificationListResponse> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
    select: NOTIFICATION_SELECT,
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    notifications: items,
    pagination: { nextCursor, hasMore },
  };
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error("通知が見つかりません");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<{ updatedCount: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updatedCount: result.count };
}

export async function getUnreadCount(
  userId: string,
): Promise<UnreadCountResponse> {
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { unreadCount };
}
