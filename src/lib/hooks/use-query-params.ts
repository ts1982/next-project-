import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * URLクエリパラメータを管理するカスタムフック
 */
export const useQueryParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return {
    searchParams,
    updateParams,
    isPending,
  };
};
