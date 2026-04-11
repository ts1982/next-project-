import { z } from "zod";

// 共通のページネーションスキーマ
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// パスワードの正規表現: 8文字以上、英字と数字を含む
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// ロールID のバリデーション（DB上のRole.id）
export const roleIdSchema = z.string().min(1, "ロールを選択してください");

// タイムゾーン更新用のスキーマ
export const updateTimezoneSchema = z.object({
  timezone: z
    .string({ message: "タイムゾーンは必須です" })
    .min(1, { message: "タイムゾーンを選択してください" })
    .refine(
      (tz) => {
        try {
          return Intl.supportedValuesOf("timeZone").includes(tz);
        } catch {
          // Intl.supportedValuesOf が使えない環境用のフォールバック
          return /^[A-Za-z]+\/[A-Za-z_]+$/.test(tz);
        }
      },
      { message: "不正なタイムゾーンです" },
    ),
});

export type UpdateTimezoneInput = z.infer<typeof updateTimezoneSchema>;
