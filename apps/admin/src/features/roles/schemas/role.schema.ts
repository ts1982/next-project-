import { z } from "zod";

/** パーミッションスコープ */
const permissionScopeSchema = z.enum(["ALL", "OWN"], {
  message: "スコープは ALL または OWN を指定してください",
});

/** パーミッション割り当て */
export const permissionAssignmentSchema = z.object({
  permissionId: z.string().min(1, "パーミッションIDは必須です"),
  scope: permissionScopeSchema,
});

/** ロール作成スキーマ */
export const createRoleSchema = z.object({
  name: z
    .string({ message: "ロール名は必須です" })
    .min(1, { message: "ロール名を入力してください" })
    .max(50, { message: "ロール名は50文字以内で入力してください" })
    .trim()
    .toUpperCase(),
  description: z
    .string()
    .max(200, { message: "説明は200文字以内で入力してください" })
    .trim()
    .optional()
    .or(z.literal("")),
  permissions: z.array(permissionAssignmentSchema).default([]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

/** ロール更新スキーマ */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, { message: "ロール名を入力してください" })
    .max(50, { message: "ロール名は50文字以内で入力してください" })
    .trim()
    .toUpperCase()
    .optional(),
  description: z
    .string()
    .max(200, { message: "説明は200文字以内で入力してください" })
    .trim()
    .nullable()
    .optional(),
  permissions: z.array(permissionAssignmentSchema).optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
