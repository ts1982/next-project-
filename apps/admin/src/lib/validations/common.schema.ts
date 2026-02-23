import { z } from "zod";

// 共通のページネーションスキーマ
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// 共通のIDスキーマ
export const idSchema = z.coerce.number().int().positive();

export type IdInput = z.infer<typeof idSchema>;
