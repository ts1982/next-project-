export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * クエリパラメータから page / limit を安全に取得する
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const rawPage = parseInt(searchParams.get("page") || String(PAGINATION.DEFAULT_PAGE), 10);
  const rawLimit = parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT), 10);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : PAGINATION.DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(rawLimit, PAGINATION.MAX_LIMIT)
      : PAGINATION.DEFAULT_LIMIT;

  return { page, limit };
}
