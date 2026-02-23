import { auth } from "../../../../auth";
import { getDefaultTimezone } from "@/lib/utils/timezone";
import { getAdminNotificationList } from "@/features/notifications/services/admin-notification.service";
import { PAGINATION } from "@/lib/constants/pagination";
import { NotificationsClientPage } from "./page.client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

const NotificationsPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const page = parseInt(params.page || String(PAGINATION.DEFAULT_PAGE));

  const data = await getAdminNotificationList(page);

  const session = await auth();
  const timezone = session?.user?.timezone || getDefaultTimezone();

  return (
    <NotificationsClientPage
      initialNotifications={data.notifications}
      initialPagination={data.pagination}
      timezone={timezone}
    />
  );
};

export default NotificationsPage;
