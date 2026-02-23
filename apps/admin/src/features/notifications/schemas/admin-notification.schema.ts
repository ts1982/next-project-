import { z } from "zod";

export const createAdminNotificationSchema = z.object({
  title: z
    .string({ message: "タイトルは必須です" })
    .min(1, "タイトルを入力してください")
    .max(200, "タイトルは200文字以内で入力してください")
    .trim(),
  body: z
    .string({ message: "本文は必須です" })
    .min(1, "本文を入力してください")
    .trim(),
  type: z.enum(["SYSTEM", "INFO", "WARNING", "PROMOTION"], {
    message: "通知種別を選択してください",
  }),
  targetType: z.enum(["ALL", "SPECIFIC"], {
    message: "配信対象を選択してください",
  }),
  targetUserIds: z.array(z.string()).optional(),
  scheduledAt: z.string().nullable().optional(),
  timezone: z.string().optional(),
});

export type CreateAdminNotificationInput = z.infer<
  typeof createAdminNotificationSchema
>;

export const updateAdminNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(200, "タイトルは200文字以内で入力してください")
    .trim()
    .optional(),
  body: z.string().min(1, "本文を入力してください").trim().optional(),
  type: z.enum(["SYSTEM", "INFO", "WARNING", "PROMOTION"]).optional(),
  targetType: z.enum(["ALL", "SPECIFIC"]).optional(),
  targetUserIds: z.array(z.string()).optional(),
  scheduledAt: z.string().nullable().optional(),
  timezone: z.string().optional(),
});

export type UpdateAdminNotificationInput = z.infer<
  typeof updateAdminNotificationSchema
>;
