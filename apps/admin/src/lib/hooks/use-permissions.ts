"use client";

import { useSession } from "next-auth/react";
import type { Resource, Action, PermissionScope } from "@/lib/auth/permissions";
import { checkPermission, canAccessResource } from "@/lib/auth/permissions";

/**
 * クライアントサイドでパーミッション判定を行うカスタムフック
 *
 * @example
 * ```tsx
 * const { can, canOwn, permissions, roleName } = usePermissions();
 *
 * // 表示制御
 * {can("users", "create") && <Button>新規登録</Button>}
 *
 * // 自己リソースの判定
 * {canOwn("users", "update", user.id) && <Button>編集</Button>}
 * ```
 */
export function usePermissions() {
  const { data: session } = useSession();

  const permissions: string[] = session?.user?.permissions ?? [];
  const currentUserId = session?.user?.id;
  const roleName = session?.user?.roleName ?? "";
  const roleId = session?.user?.roleId ?? "";

  /**
   * 指定リソース・アクションの権限があるかチェック
   * @returns マッチしたスコープ or null
   */
  function check(resource: Resource, action: Action): PermissionScope | null {
    return checkPermission(permissions, resource, action);
  }

  /**
   * 指定リソース・アクションの権限があるか（boolean）
   * scope: "all" なら true、scope: "own" でも true（リスト表示等で使用）
   */
  function can(resource: Resource, action: Action): boolean {
    return checkPermission(permissions, resource, action) !== null;
  }

  /**
   * 特定リソースインスタンスへのアクセス権があるか
   * scope: "own" の場合は resourceOwnerId === currentUserId を検証
   */
  function canOwn(resource: Resource, action: Action, resourceOwnerId?: string): boolean {
    return canAccessResource(permissions, resource, action, resourceOwnerId, currentUserId);
  }

  return {
    permissions,
    currentUserId,
    roleName,
    roleId,
    check,
    can,
    canOwn,
  };
}
