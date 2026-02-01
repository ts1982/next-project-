import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  /**
   * 表示する行数
   * @default 10
   */
  rows?: number;
  /**
   * 表示する列数
   */
  columns: number;
  /**
   * 各列の幅設定（Tailwind classname）
   */
  columnWidths?: string[];
  /**
   * テーブルヘッダー（オプション）
   */
  headers?: string[];
  /**
   * アクセシビリティラベル
   */
  ariaLabel?: string;
}

/**
 * データテーブルのローディング状態を表示する汎用スケルトンコンポーネント
 *
 * @example
 * ```tsx
 * <TableSkeleton
 *   columns={5}
 *   headers={["ID", "名前", "メールアドレス", "登録日", "更新日"]}
 *   columnWidths={["w-20", "w-32", "w-48", "w-32", "w-32"]}
 * />
 * ```
 */
export const TableSkeleton = ({
  rows = 10,
  columns,
  columnWidths = [],
  headers = [],
  ariaLabel = "データ読み込み中",
}: TableSkeletonProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table aria-label={ariaLabel} aria-busy="true">
          {headers.length > 0 && (
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index} className={columnWidths[index]}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <div
                      className={`h-4 animate-pulse rounded bg-muted ${
                        columnWidths[colIndex] || "w-32"
                      }`}
                      aria-hidden="true"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
