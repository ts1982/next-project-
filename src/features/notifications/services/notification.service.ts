import { prisma } from "@/lib/db/prisma";
import type { NotificationListResponse } from "../types/notification.types";

/** 通知取得時の select フィールド */
const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  title: true,
  body: true,
  type: true,
  isRead: true,
  scheduledAt: true,
  createdAt: true,
} as const;

/** デフォルトの1ページあたり件数 */
const DEFAULT_LIMIT = 20;

/**
 * ユーザーの通知一覧を取得する（カーソルベースページネーション）
 *
 * @param userId  対象ユーザーID
 * @param cursor  カーソル（前回取得の最後の通知ID）
 * @param limit   取得件数（デフォルト: 20）
 * @returns 通知一覧 + ページネーション情報
 */
export async function getNotificationsByUserId(
  userId: string,
  cursor?: string,
  limit: number = DEFAULT_LIMIT,
): Promise<NotificationListResponse> {
  // limit + 1 件取得して hasMore を判定する
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // カーソル自体をスキップ
        }
      : {}),
    select: NOTIFICATION_SELECT,
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    notifications: items,
    pagination: {
      nextCursor,
      hasMore,
    },
  };
}
