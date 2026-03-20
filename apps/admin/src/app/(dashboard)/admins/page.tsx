export const dynamic = "force-dynamic";

import { getAdminList } from "@/features/admins";
import { PAGINATION } from "@/lib/constants/pagination";
import { getDefaultTimezone } from "@/lib/utils/timezone";
import { AdminsClientPage } from "./page.client";
import { auth } from "../../../../auth";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

const AdminsPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || String(PAGINATION.DEFAULT_PAGE));

  const data = await getAdminList(search, page);

  // セッションからユーザーのタイムゾーンを取得
  const session = await auth();
  const timezone = session?.user?.timezone || getDefaultTimezone();

  return (
    <AdminsClientPage
      initialAdmins={data.admins}
      initialSearch={search}
      initialPagination={data.pagination}
      timezone={timezone}
    />
  );
};

export default AdminsPage;
