"use client";

import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "./table-skeleton";
import { Pagination } from "./pagination";

/**
 * テーブル列の定義
 */
export interface Column<T> {
  /**
   * 列のキー（一意な識別子）
   */
  key: string;
  /**
   * 列のヘッダーテキスト
   */
  header: string;
  /**
   * セルの内容をレンダリングする関数
   */
  render: (item: T) => ReactNode;
  /**
   * 列の幅クラス（Tailwind CSS）
   */
  className?: string;
}

/**
 * ページネーション設定
 */
export interface PaginationConfig {
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
}

interface DataTableProps<T> {
  /**
   * 表示するデータの配列
   */
  data: T[];
  /**
   * 列の定義
   */
  columns: Column<T>[];
  /**
   * 各行のキーを取得する関数
   */
  getRowKey: (item: T) => string | number;
  /**
   * 行クリック時のコールバック（オプション）
   */
  onRowClick?: (item: T) => void;
  /**
   * データが空の場合のメッセージ
   */
  emptyMessage?: string;
  /**
   * ページネーション設定（オプション）
   */
  pagination?: PaginationConfig;
  /**
   * ローディング状態
   */
  isLoading?: boolean;
  /**
   * テーブルのアクセシビリティラベル
   */
  ariaLabel?: string;
  /**
   * テーブル全体のラッパークラス
   */
  className?: string;
}

/**
 * アクセシビリティ対応の汎用データテーブルコンポーネント
 *
 * 以下の機能を標準搭載:
 * - ジェネリック型による型安全な列定義
 * - オプショナルなページネーション
 * - ローディング状態（スケルトンUI表示）
 * - 行クリックイベント（role="button", tabIndex対応）
 * - 空状態の表示
 * - aria-label によるスクリーンリーダー対応
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={users}
 *   columns={[
 *     { key: "id", header: "ID", render: (user) => user.id },
 *     { key: "name", header: "名前", render: (user) => user.name },
 *   ]}
 *   getRowKey={(user) => user.id}
 *   onRowClick={handleUserClick}
 *   pagination={{
 *     currentPage: page,
 *     totalPages: 10,
 *     totalItems: 100,
 *     itemsPerPage: 10,
 *     onPageChange: setPage,
 *   }}
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  onRowClick,
  emptyMessage = "データが見つかりませんでした",
  pagination,
  isLoading = false,
  ariaLabel = "データテーブル",
  className = "",
}: DataTableProps<T>) {
  // ローディング中はスケルトンを表示
  if (isLoading) {
    return (
      <div className={className}>
        <TableSkeleton
          columns={columns.length}
          headers={columns.map((col) => col.header)}
          columnWidths={columns.map((col) => col.className || "")}
          ariaLabel={ariaLabel}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-lg border bg-card">
        <Table aria-label={ariaLabel}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const rowKey = getRowKey(item);
                const isClickable = !!onRowClick;

                return (
                  <TableRow
                    key={rowKey}
                    onClick={isClickable ? () => onRowClick(item) : undefined}
                    className={
                      isClickable
                        ? "cursor-pointer hover:bg-muted/50 transition-colors"
                        : ""
                    }
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={
                      isClickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(item);
                            }
                          }
                        : undefined
                    }
                    aria-label={isClickable ? `行を選択: ${rowKey}` : undefined}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
