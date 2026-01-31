import { z } from "zod";

export const createStoreSchema = z
  .object({
    name: z
      .string({ message: "店舗名は必須です" })
      .min(1, "店舗名は必須です")
      .max(100, "店舗名は100文字以内で入力してください"),
    description: z
      .string()
      .max(500, "説明は500文字以内で入力してください")
      .optional(),
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
    publishedAt: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
        "有効な日時形式（yyyy-MM-ddTHH:mm:ss）で入力してください",
      )
      .nullable()
      .optional(),
    unpublishedAt: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
        "有効な日時形式（yyyy-MM-ddTHH:mm:ss）で入力してください",
      )
      .nullable()
      .optional(),
    timezone: z.string().optional(),
  })
  .refine(
    (data) => {
      // publishedAtとunpublishedAtの両方が設定されている場合、整合性チェック
      if (data.publishedAt && data.unpublishedAt) {
        const publishedDate = new Date(data.publishedAt);
        const unpublishedDate = new Date(data.unpublishedAt);
        return unpublishedDate > publishedDate;
      }
      return true;
    },
    {
      message: "公開終了日時は公開開始日時より後である必要があります",
      path: ["unpublishedAt"],
    },
  );

export const updateStoreSchema = createStoreSchema.partial();

export type CreateStoreSchema = z.infer<typeof createStoreSchema>;
export type UpdateStoreSchema = z.infer<typeof updateStoreSchema>;
