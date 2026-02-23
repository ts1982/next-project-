import { getStoreList } from "@/features/stores"
import { PAGINATION } from "@/lib/constants/pagination"
import { getDefaultTimezone } from "@/lib/utils/timezone"
import { StoresClientPage } from "./page.client"
import { auth } from "../../../../auth"

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

const StoresPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const search = params.search || ""
  const page = parseInt(params.page || String(PAGINATION.DEFAULT_PAGE))

  const data = await getStoreList(search, page)
  
  // セッションからユーザーのタイムゾーンを取得
  const session = await auth()
  const timezone = session?.user?.timezone || getDefaultTimezone()

  return (
    <StoresClientPage
      initialStores={data.stores}
      initialSearch={search}
      initialPagination={data.pagination}
      timezone={timezone}
    />
  )
}

export default StoresPage
