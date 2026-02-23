import { auth } from "../../../../auth";
import { getNotificationsByUserId } from "@/features/notifications/services/notification.service";
import { getUnreadCount } from "@/features/notifications/services/notification.service";
import { NotificationsClientPage } from "./page.client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [data, { unreadCount }] = await Promise.all([
    getNotificationsByUserId(session.user.id, undefined, 20),
    getUnreadCount(session.user.id),
  ]);

  return (
    <NotificationsClientPage
      initialNotifications={data.notifications}
      initialPagination={data.pagination}
      initialUnreadCount={unreadCount}
    />
  );
}
