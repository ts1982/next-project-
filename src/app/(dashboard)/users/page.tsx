import { getUserList } from "@/features/users";
import { PAGINATION } from "@/lib/constants/pagination";
import { getDefaultTimezone } from "@/lib/utils/timezone";
import { UsersClientPage } from "./page.client";
import { auth } from "../../../../auth";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

const UsersPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || String(PAGINATION.DEFAULT_PAGE));

  const data = await getUserList(search, page);

  // セッションからユーザーのタイムゾーンを取得
  const session = await auth();
  const timezone = session?.user?.timezone || getDefaultTimezone();

  return (
    <UsersClientPage
      initialUsers={data.users}
      initialSearch={search}
      initialPagination={data.pagination}
      timezone={timezone}
    />
  );
};

export default UsersPage;
