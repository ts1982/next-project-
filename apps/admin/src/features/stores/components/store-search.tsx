"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SearchForm } from "@/components/common/search-form"

interface StoreSearchProps {
  defaultValue?: string
}

export function StoreSearch({ defaultValue = "" }: StoreSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams)
    if (query) {
      params.set("search", query)
    } else {
      params.delete("search")
    }
    params.delete("page") // 検索時はページをリセット
    router.push(`/stores?${params.toString()}`)
  }

  return (
    <SearchForm
      placeholder="店舗名または住所で検索..."
      defaultValue={defaultValue}
      onSearch={handleSearch}
      ariaLabel="店舗検索"
    />
  )
}
