import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

/**
 * URLクエリパラメータを管理するカスタムフック
 */
export const useQueryParams = (basePath?: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const targetPath = basePath ?? pathname;

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
      const queryString = params.toString();
      const url = queryString ? `${targetPath}?${queryString}` : targetPath;
      router.push(url);
    });
  };

  return {
    searchParams,
    updateParams,
    isPending,
  };
};
