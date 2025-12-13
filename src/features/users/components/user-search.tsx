"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUserSearch } from "@/lib/hooks"

interface UserSearchProps {
  defaultValue?: string
}

export const UserSearch = ({ defaultValue = "" }: UserSearchProps) => {
  const [searchText, setSearchText] = useState(defaultValue)
  const { search, clear, isPending } = useUserSearch()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search(searchText)
  }

  const handleClear = () => {
    setSearchText("")
    clear()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="名前またはメールアドレスで検索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "検索中..." : "検索"}
      </Button>
      {searchText && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={isPending}
        >
          クリア
        </Button>
      )}
    </form>
  )
}
