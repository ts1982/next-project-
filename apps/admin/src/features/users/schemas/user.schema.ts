import { z } from "zod";
import {
  PASSWORD_REGEX,
  updateTimezoneSchema,
  type UpdateTimezoneInput,
} from "@/lib/validations/common.schema";

export { updateTimezoneSchema, type UpdateTimezoneInput };

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
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "少なくとも1項目は入力してください",
    path: ["name"],
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
