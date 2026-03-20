"use client";

import { SearchForm } from "@/components/common/search-form";
import { useUserSearch } from "@/lib/hooks";

interface UserSearchProps {
  defaultValue?: string;
}

export const UserSearch = ({ defaultValue = "" }: UserSearchProps) => {
  const { search, clear, isPending } = useUserSearch();

  return (
    <SearchForm
      placeholder="名前またはメールアドレスで検索..."
      defaultValue={defaultValue}
      onSearch={search}
      onClear={clear}
      ariaLabel="ユーザー検索"
      maxWidth="max-w-lg"
      isPending={isPending}
    />
  );
};
