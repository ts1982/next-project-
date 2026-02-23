import { useId } from "react";
import { Input } from "@/components/ui/input";

interface FormFieldProps {
  /**
   * フィールドのラベル
   */
  label: string;
  /**
   * フィールドの値（children 未使用時に指定）
   */
  value?: string;
  /**
   * 値変更時のコールバック（children 未使用時に指定）
   */
  onChange?: (value: string) => void;
  /**
   * 子要素（Input の代わりに任意のコンテンツを渡す場合）
   */
  children?: React.ReactNode;
  /**
   * エラーメッセージ（オプション）
   */
  error?: string;
  /**
   * 必須フィールドかどうか
   * @default false
   */
  required?: boolean;
  /**
   * input type属性
   * @default "text"
   */
  type?: string;
  /**
   * プレースホルダー
   */
  placeholder?: string;
  /**
   * フィールド名（formのname属性）
   */
  name?: string;
  /**
   * カスタムID（未指定の場合は自動生成）
   */
  id?: string;
  /**
   * 追加のCSSクラス
   */
  className?: string;
  /**
   * 入力の無効化
   */
  disabled?: boolean;
}

/**
 * アクセシビリティ対応のフォームフィールドコンポーネント
 *
 * 以下の機能を標準搭載:
 * - 必須フィールドマーク（aria-label="必須"）
 * - エラー状態の視覚表示とスクリーンリーダー通知（aria-invalid、aria-describedby）
 * - 一意なID自動生成（useId）
 * - エラーメッセージのrole="alert"
 *
 * @example
 * ```tsx
 * <FormField
 *   label="メールアドレス"
 *   value={email}
 *   onChange={setEmail}
 *   error={errors.email}
 *   required
 *   type="email"
 * />
 * ```
 */
export const FormField = ({
  label,
  value,
  onChange,
  children,
  error,
  required = false,
  type = "text",
  placeholder,
  name,
  id: customId,
  className,
  disabled = false,
}: FormFieldProps) => {
  const generatedId = useId();
  const fieldId = customId || generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-sm font-medium mb-2">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="必須">
            *
          </span>
        )}
      </label>
      {children ?? (
        <Input
          id={fieldId}
          name={name || fieldId}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={error ? "border-red-500" : ""}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
        />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
