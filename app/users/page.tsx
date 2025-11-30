import { Suspense } from "react"
import { Users as UsersIcon } from "lucide-react"
import { UserSearch, UserTable, UserTableSkeleton } from "@/features/users"
import { getUserList } from "@/lib/services/user.service"
import { PAGINATION } from "@/lib/constants/pagination"

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

const UsersPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const search = params.search || ""
  const page = parseInt(params.page || String(PAGINATION.DEFAULT_PAGE))

  const data = await getUserList(search, page)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
        </div>
        <p className="text-muted-foreground">
          登録ユーザーの一覧を表示・検索できます
        </p>
      </div>

      <UserSearch defaultValue={search} />

      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable users={data.users} pagination={data.pagination} />
      </Suspense>
    </div>
  )
}

export default UsersPage
