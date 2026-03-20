import { auth } from "../../../auth";
import type { Resource, Action, PermissionScope } from "./permissions";
import { checkPermission, canAccessResource } from "./permissions";

// ---------------------------------------------------------------------------
// エラークラス
// ---------------------------------------------------------------------------

/**
 * 認証エラー（401）
 */
export class UnauthorizedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * 権限エラー（403）
 */
export class ForbiddenError extends Error {
  constructor(message = "この操作を行う権限がありません") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// ---------------------------------------------------------------------------
// ガード関数の戻り値型
// ---------------------------------------------------------------------------

export interface PermissionResult {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    roleId: string;
    roleName: string;
    permissions: string[];
    timezone?: string | null;
  };
  /** マッチしたスコープ（"all" or "own"）。requireUser のみの場合は undefined */
  scope?: PermissionScope;
}

// ---------------------------------------------------------------------------
// ガード関数
// ---------------------------------------------------------------------------

/**
 * 認証済みユーザーを取得する共通ガード関数
 * 未認証の場合は UnauthorizedError を throw する
 *
 * @throws {UnauthorizedError} 未認証の場合
 * @returns 認証済みユーザー情報
 */
export async function requireUser(): Promise<PermissionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      roleId: session.user.roleId ?? "",
      roleName: session.user.roleName ?? "",
      permissions: session.user.permissions ?? [],
      timezone: session.user.timezone,
    },
  };
}

/**
 * パーミッションベースの認可ガード
 *
 * @param resource  リソース種別 ("users", "stores", "roles")
 * @param action    操作種別 ("read", "create", "update", "delete")
 * @param resourceOwnerId  リソースの所有者ID（scope: "own" の判定に使用、省略時はリスト操作扱い）
 *
 * @throws {UnauthorizedError} 未認証の場合
 * @throws {ForbiddenError} パーミッションがない場合
 * @returns { user, scope } — scope は "all" or "own"
 *
 * @example
 * ```ts
 * // リスト取得（scope に応じて返却データを分岐）
 * const { user, scope } = await requirePermission("users", "read");
 * if (scope === "own") {
 *   // 自分のデータのみ返却
 * }
 *
 * // 特定リソースの更新（自己リソースなら own でも通過）
 * await requirePermission("users", "update", targetUserId);
 * ```
 */
export async function requirePermission(
  resource: Resource,
  action: Action,
  resourceOwnerId?: string,
): Promise<PermissionResult> {
  const { user } = await requireUser();

  // resourceOwnerId が渡された場合は自己リソースチェック含む
  if (resourceOwnerId) {
    const allowed = canAccessResource(user.permissions, resource, action, resourceOwnerId, user.id);
    if (!allowed) {
      throw new ForbiddenError();
    }
    // 実際にマッチしたスコープを返す
    const scope = checkPermission(user.permissions, resource, action)!;
    return { user, scope };
  }

  // リスト操作等（resourceOwnerId なし）
  const scope = checkPermission(user.permissions, resource, action);
  if (!scope) {
    throw new ForbiddenError();
  }

  return { user, scope };
}
