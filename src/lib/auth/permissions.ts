/**
 * RBAC パーミッション基盤
 *
 * パーミッション文字列は "resource:action:scope" 形式で統一する。
 *   例: "users:read:all", "users:update:own", "stores:delete:all"
 *
 * JWT / Session に permissions: string[] として埋め込み、
 * サーバー・クライアント双方で同一ロジックで判定できる。
 */

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/** システムで管理するリソース */
export type Resource = "users" | "stores" | "roles";

/** リソースに対する操作 */
export type Action = "read" | "create" | "update" | "delete";

/** パーミッションスコープ */
export type PermissionScope = "all" | "own";

/** 正規化されたパーミッション文字列 */
export type PermissionString = `${Resource}:${Action}:${PermissionScope}`;

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

export const RESOURCES: Resource[] = ["users", "stores", "roles"];

export const ACTIONS: Action[] = ["read", "create", "update", "delete"];

export const RESOURCE_LABELS: Record<Resource, string> = {
  users: "ユーザー",
  stores: "店舗",
  roles: "ロール",
};

export const ACTION_LABELS: Record<Action, string> = {
  read: "閲覧",
  create: "作成",
  update: "更新",
  delete: "削除",
};

export const SCOPE_LABELS: Record<PermissionScope, string> = {
  all: "すべて",
  own: "自分のみ",
};

// ---------------------------------------------------------------------------
// ヘルパー関数
// ---------------------------------------------------------------------------

/**
 * パーミッション文字列を生成する
 */
export function buildPermissionString(
  resource: Resource,
  action: Action,
  scope: PermissionScope,
): PermissionString {
  return `${resource}:${action}:${scope}`;
}

/**
 * パーミッション文字列をパースする
 */
export function parsePermissionString(
  perm: string,
): { resource: Resource; action: Action; scope: PermissionScope } | null {
  const parts = perm.split(":");
  if (parts.length !== 3) return null;

  const [resource, action, scope] = parts;
  if (
    !RESOURCES.includes(resource as Resource) ||
    !ACTIONS.includes(action as Action) ||
    !["all", "own"].includes(scope as string)
  ) {
    return null;
  }

  return {
    resource: resource as Resource,
    action: action as Action,
    scope: scope as PermissionScope,
  };
}

/**
 * ユーザーが指定リソース・アクションの権限を持っているかチェック
 *
 * @returns マッチしたスコープ ("all" | "own") or null（権限なし）
 */
export function checkPermission(
  permissions: string[],
  resource: Resource,
  action: Action,
): PermissionScope | null {
  // "all" スコープを優先チェック
  if (permissions.includes(`${resource}:${action}:all`)) {
    return "all";
  }
  if (permissions.includes(`${resource}:${action}:own`)) {
    return "own";
  }
  return null;
}

/**
 * 自己リソースへのアクセスを含めた権限チェック
 *
 * @param permissions    ユーザーのパーミッション配列
 * @param resource       リソース種別
 * @param action         操作種別
 * @param resourceOwnerId  リソースの所有者ID（省略時はリスト操作扱い）
 * @param currentUserId  現在のユーザーID
 * @returns true if authorized
 */
export function canAccessResource(
  permissions: string[],
  resource: Resource,
  action: Action,
  resourceOwnerId?: string,
  currentUserId?: string,
): boolean {
  const scope = checkPermission(permissions, resource, action);
  if (!scope) return false;
  if (scope === "all") return true;

  // scope === "own": リソースオーナーID と現在ユーザーID を比較
  if (!resourceOwnerId || !currentUserId) return false;
  return resourceOwnerId === currentUserId;
}
