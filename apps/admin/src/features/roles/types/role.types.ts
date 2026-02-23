import type { PermissionScope } from "@/lib/auth/permissions";

/** ロール */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** ロール詳細（パーミッション付き） */
export interface RoleWithPermissions extends Role {
  permissions: RolePermissionEntry[];
}

/** ロールに紐づくパーミッション */
export interface RolePermissionEntry {
  id: string;
  resource: string;
  action: string;
  scope: PermissionScope;
  description: string | null;
}

/** ロール一覧レスポンス */
export interface RoleListResponse {
  roles: RoleWithPermissions[];
}

/** パーミッション定義（マスタ） */
export interface PermissionDefinition {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}
