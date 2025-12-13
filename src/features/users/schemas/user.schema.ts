import { z } from "zod";

// ユーザー作成用のzodスキーマ
export const createUserSchema = z.object({
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください" }),
  password: z
    .string()
    .min(4, { message: "パスワードは4文字以上で入力してください" }),
  name: z.string().min(1, { message: "名前を入力してください" }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ユーザー更新用のスキーマ（将来的に使用）
export const updateUserSchema = z.object({
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください" })
    .optional(),
  name: z.string().min(1, { message: "名前を入力してください" }).optional(),
  password: z
    .string()
    .min(4, { message: "パスワードは4文字以上で入力してください" })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
