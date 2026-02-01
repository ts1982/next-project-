import { Suspense } from "react"
import Link from "next/link"
import { Users as UsersIcon } from "lucide-react"
import { UserSearch, UserTable } from "@/features/users"
import { getUserList } from "@/features/users"
import { PAGINATION } from "@/lib/constants/pagination"
import { Button } from "@/components/ui/button"
import { TableSkeleton } from "@/components/common"

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
          </div>
          <Link href="/users/create">
            <Button>新規作成</Button>
          </Link>
        </div>
        <p className="text-muted-foreground">
          登録ユーザーの一覧を表示・検索できます
        </p>
      </div>

      <UserSearch defaultValue={search} />

      <Suspense
        fallback={
          <TableSkeleton
            columns={5}
            headers={["ID", "名前", "メールアドレス", "登録日", "更新日"]}
            columnWidths={["w-20", "w-32", "w-48", "w-32", "w-32"]}
            ariaLabel="ユーザー一覧読み込み中"
          />
        }
      >
        <UserTable users={data.users} pagination={data.pagination} />
      </Suspense>
    </div>
  )
}

export default UsersPage
