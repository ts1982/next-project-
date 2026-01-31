import { getStoreList } from "@/features/stores"
import { PAGINATION } from "@/lib/constants/pagination"
import { StoresClientPage } from "./page.client"

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

  return (
    <StoresClientPage
      initialStores={data.stores}
      initialSearch={search}
      initialPagination={data.pagination}
    />
  )
}

export default StoresPage
