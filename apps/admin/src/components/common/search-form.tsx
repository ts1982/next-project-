"use client";

import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  /**
   * プレースホルダーテキスト
   */
  placeholder: string;
  /**
   * 検索実行時のコールバック
   */
  onSearch: (query: string) => void;
  /**
   * クリア実行時のコールバック（オプション）
   */
  onClear?: () => void;
  /**
   * 検索フィールドのデフォルト値
   */
  defaultValue?: string;
  /**
   * フォームのアクセシビリティラベル
   */
  ariaLabel?: string;
  /**
   * 最大幅のスタイル
   */
  maxWidth?: string;
  /**
   * クリアボタンを表示するかどうか
   * @default true
   */
  showClearButton?: boolean;
  /**
   * 外部から渡すローディング状態
   */
  isPending?: boolean;
}

/**
 * アクセシビリティ対応の汎用検索フォームコンポーネント
 *
 * 以下の機能を標準搭載:
 * - role="search"によるセマンティックHTML
 * - aria-labelによるスクリーンリーダー対応
 * - 検索アイコンの視覚的表示
 * - オプショナルなクリアボタン
 * - useTransitionによるスムーズなUI更新
 *
 * @example
 * ```tsx
 * <SearchForm
 *   placeholder="店舗名または住所で検索..."
 *   onSearch={(query) => router.push(`/stores?search=${query}`)}
 *   defaultValue={searchParams.get("search") || ""}
 * />
 * ```
 */
export const SearchForm = ({
  placeholder,
  onSearch,
  onClear,
  defaultValue = "",
  ariaLabel = "検索フォーム",
  maxWidth = "max-w-sm",
  showClearButton = true,
  isPending: pendingProp,
}: SearchFormProps) => {
  const [searchText, setSearchText] = useState(defaultValue);
  const [isPendingInternal, startTransition] = useTransition();
  const isPending = pendingProp ?? isPendingInternal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      onSearch(searchText);
    });
  };

  const handleClear = () => {
    setSearchText("");
    if (onClear) {
      startTransition(() => {
        onClear();
      });
    } else {
      startTransition(() => {
        onSearch("");
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2"
      role="search"
      aria-label={ariaLabel}
    >
      <div className={`relative flex-1 ${maxWidth}`}>
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
          disabled={isPending}
          aria-label={placeholder}
        />
        {showClearButton && searchText && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="検索をクリア"
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "検索中..." : "検索"}
      </Button>
    </form>
  );
};
