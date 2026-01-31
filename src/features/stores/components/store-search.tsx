"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"

interface StoreSearchProps {
  defaultValue?: string
}

export function StoreSearch({ defaultValue = "" }: StoreSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    params.delete("page") // 検索時はページをリセット
    startTransition(() => {
      router.push(`/stores?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="店舗名または住所で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        検索
      </Button>
    </form>
  )
}
