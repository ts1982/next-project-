"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  /**
   * 現在のページ番号（1始まり）
   */
  currentPage: number;
  /**
   * 総ページ数
   */
  totalPages: number;
  /**
   * 全アイテム数
   */
  totalItems: number;
  /**
   * 1ページあたりのアイテム数
   */
  itemsPerPage: number;
  /**
   * ページ変更時のコールバック
   */
  onPageChange: (page: number) => void;
  /**
   * ローディング状態
   */
  isLoading?: boolean;
  /**
   * 最大表示ページ番号数（例: 5 なら [1][2][3][4][5] のように表示）
   * @default undefined（全ページを表示）
   */
  maxPageButtons?: number;
  /**
   * ページ情報テキストのカスタマイズ
   */
  showInfo?: boolean;
}

/**
 * アクセシビリティ対応の汎用ページネーションコンポーネント
 *
 * 以下の機能を標準搭載:
 * - 前へ/次へボタン
 * - ページ番号ボタン（大量ページの場合は省略表示可能）
 * - 現在の表示範囲情報（例: 100件中 11-20件を表示）
 * - aria-label, aria-current による適切なスクリーンリーダー対応
 * - ローディング中の無効化
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={10}
 *   totalItems={100}
 *   itemsPerPage={10}
 *   onPageChange={handlePageChange}
 * />
 * ```
 */
export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
  maxPageButtons,
  showInfo = true,
}: PaginationProps) => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // ページ番号リストの生成（省略表示対応）
  const getPageNumbers = (): (number | string)[] => {
    if (!maxPageButtons || totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const halfRange = Math.floor(maxPageButtons / 2);
    let startPage = Math.max(1, currentPage - halfRange);
    let endPage = Math.min(totalPages, currentPage + halfRange);

    // 現在ページが最初の方にある場合
    if (currentPage <= halfRange) {
      endPage = Math.min(maxPageButtons, totalPages);
    }

    // 現在ページが最後の方にある場合
    if (currentPage > totalPages - halfRange) {
      startPage = Math.max(1, totalPages - maxPageButtons + 1);
    }

    // 最初のページを常に表示
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    // 範囲内のページを表示
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // 最後のページを常に表示
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center justify-between" aria-label="ページネーション">
      {showInfo && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {totalItems}件中 {start}-{end}件を表示
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          aria-label="前のページへ"
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>
        <div className="flex items-center gap-1" role="group" aria-label="ページ番号">
          {pageNumbers.map((pageNum, index) =>
            typeof pageNum === "number" ? (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className="w-10"
                aria-label={`ページ ${pageNum}`}
                aria-current={pageNum === currentPage ? "page" : undefined}
              >
                {pageNum}
              </Button>
            ) : (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
                aria-hidden="true"
              >
                {pageNum}
              </span>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          aria-label="次のページへ"
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};
