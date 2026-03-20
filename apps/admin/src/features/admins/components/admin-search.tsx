"use client";

import { SearchForm } from "@/components/common/search-form";
import { useAdminSearch } from "@/lib/hooks";

interface AdminSearchProps {
  defaultValue?: string;
}

export const AdminSearch = ({ defaultValue = "" }: AdminSearchProps) => {
  const { search, clear, isPending } = useAdminSearch();

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
