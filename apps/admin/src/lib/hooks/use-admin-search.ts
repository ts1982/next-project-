import { useQueryParams } from "./use-query-params";

/**
 * 管理者検索用のカスタムフック
 */
export const useAdminSearch = () => {
  const { updateParams, isPending } = useQueryParams();

  const search = (query: string) => {
    updateParams({
      search: query || null,
      page: null,
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
