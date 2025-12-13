import { useQueryParams } from "./use-query-params";

/**
 * ユーザー検索用のカスタムフック
 */
export const useUserSearch = () => {
  const { updateParams, isPending } = useQueryParams();

  const search = (query: string) => {
    updateParams({
      search: query || null,
      page: null, // 検索時はページをリセット
    });
  };

  const clear = () => {
    updateParams({
      search: null,
      page: null,
    });
  };

  return {
    search,
    clear,
    isPending,
  };
};
