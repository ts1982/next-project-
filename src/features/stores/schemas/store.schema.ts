import { z } from "zod"

export const createStoreSchema = z.object({
  name: z
    .string({ message: "店舗名は必須です" })
    .min(1, "店舗名は必須です")
    .max(100, "店舗名は100文字以内で入力してください"),
  description: z.string().max(500, "説明は500文字以内で入力してください").optional(),
  address: z
    .string({ message: "住所は必須です" })
    .min(1, "住所は必須です")
    .max(200, "住所は200文字以内で入力してください"),
  phone: z
    .string()
    .regex(/^[0-9-]+$/, "電話番号は数字とハイフンのみで入力してください")
    .max(20, "電話番号は20文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .max(100, "メールアドレスは100文字以内で入力してください")
    .optional()
    .or(z.literal("")),
})

export const updateStoreSchema = createStoreSchema.partial()

export type CreateStoreSchema = z.infer<typeof createStoreSchema>
export type UpdateStoreSchema = z.infer<typeof updateStoreSchema>
