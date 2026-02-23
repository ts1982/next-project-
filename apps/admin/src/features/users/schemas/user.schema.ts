import { z } from "zod";

// パスワードの正規表現: 8文字以上、英字と数字を含む
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// ロールID のバリデーション（DB上のRole.id）
const roleIdSchema = z.string().min(1, "ロールを選択してください");

// ユーザー作成用のzodスキーマ
export const createUserSchema = z.object({
  email: z
    .string({ message: "メールアドレスは必須です" })
    .email({ message: "有効なメールアドレスを入力してください" })
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: "パスワードは必須です" })
    .min(8, { message: "パスワードは8文字以上で入力してください" })
    .regex(PASSWORD_REGEX, {
      message: "パスワードは英字と数字を含む必要があります",
    }),
  name: z
    .string({ message: "名前は必須です" })
    .min(1, { message: "名前を入力してください" })
    .max(100, { message: "名前は100文字以内で入力してください" })
    .trim(),
  roleId: roleIdSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ユーザー更新用のスキーマ
export const updateUserSchema = z
  .object({
    email: z
      .string()
      .email({ message: "有効なメールアドレスを入力してください" })
      .toLowerCase()
      .trim()
      .optional(),
    name: z
      .string()
      .min(1, { message: "名前を入力してください" })
      .max(100, { message: "名前は100文字以内で入力してください" })
      .trim()
      .optional(),
    password: z
      .string()
      .min(8, { message: "パスワードは8文字以上で入力してください" })
      .regex(PASSWORD_REGEX, {
        message: "パスワードは英字と数字を含む必要があります",
      })
      .optional(),
    roleId: z.string().min(1, "ロールを選択してください").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "少なくとも1項目は入力してください",
    path: ["name"],
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

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
