import { prisma } from "@/lib/db/prisma";

/**
 * 監査ログを記録する
 *
 * @param adminId  操作を行った管理者のID
 * @param action   操作種別（例: "role.create", "role.update", "admin.delete"）
 * @param target   操作対象の説明（例: "ロール ADMIN", "管理者 admin@example.com"）
 * @param details  追加の詳細情報（before/after の差分など）
 */
export async function audit(
  adminId: string,
  action: string,
  target: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      target,
      details: details ?? undefined,
    },
  });
}
