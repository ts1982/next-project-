import { useQueryParams } from "./use-query-params";

/**
 * ページネーション用のカスタムフック
 */
export const usePagination = () => {
  const { updateParams, isPending } = useQueryParams();

  const goToPage = (page: number) => {
    updateParams({
      page: page.toString(),
    });
  };

  const nextPage = (currentPage: number) => {
    goToPage(currentPage + 1);
  };

  const prevPage = (currentPage: number) => {
    goToPage(currentPage - 1);
  };

  return {
    goToPage,
    nextPage,
    prevPage,
    isPending,
  };
};
