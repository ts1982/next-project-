import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type {
  RoleWithPermissions,
  RoleListResponse,
  PermissionDefinition,
} from "../types/role.types";
import type { CreateRoleInput, UpdateRoleInput } from "../schemas/role.schema";
import type { PermissionScope } from "@/lib/auth/permissions";

// ---------------------------------------------------------------------------
// include 定義
// ---------------------------------------------------------------------------

const ROLE_WITH_PERMISSIONS_INCLUDE = {
  rolePermissions: {
    include: { permission: true },
  },
} satisfies Prisma.RoleInclude;

// ---------------------------------------------------------------------------
// 変換ヘルパー
// ---------------------------------------------------------------------------

type RoleWithRelations = Prisma.RoleGetPayload<{
  include: typeof ROLE_WITH_PERMISSIONS_INCLUDE;
}>;

function transformRole(role: RoleWithRelations): RoleWithPermissions {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.rolePermissions.map((rp) => ({
      id: rp.permission.id,
      resource: rp.permission.resource,
      action: rp.permission.action,
      scope: rp.scope.toLowerCase() as PermissionScope,
      description: rp.permission.description,
    })),
  };
}

// ---------------------------------------------------------------------------
// サービス
// ---------------------------------------------------------------------------

/** 全ロール一覧を取得 */
export async function getRoleList(): Promise<RoleListResponse> {
  const roles = await prisma.role.findMany({
    include: ROLE_WITH_PERMISSIONS_INCLUDE,
    orderBy: { name: "asc" },
  });

  return {
    roles: roles.map(transformRole),
  };
}

/** ロール詳細を取得 */
export async function getRoleById(
  id: string,
): Promise<RoleWithPermissions | null> {
  const role = await prisma.role.findUnique({
    where: { id },
    include: ROLE_WITH_PERMISSIONS_INCLUDE,
  });

  return role ? transformRole(role) : null;
}

/** ロールを作成 */
export async function createRole(
  input: CreateRoleInput,
): Promise<RoleWithPermissions> {
  const role = await prisma.role.create({
    data: {
      name: input.name,
      description: input.description || null,
      rolePermissions: {
        create: input.permissions.map((p) => ({
          permissionId: p.permissionId,
          scope: p.scope,
        })),
      },
    },
    include: ROLE_WITH_PERMISSIONS_INCLUDE,
  });

  return transformRole(role);
}

/** ロールを更新 */
export async function updateRole(
  id: string,
  input: UpdateRoleInput,
): Promise<RoleWithPermissions> {
  const role = await prisma.$transaction(async (tx) => {
    // パーミッションが指定されている場合は差し替え（delete + create）
    if (input.permissions) {
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });
    }

    return tx.role.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.permissions && {
          rolePermissions: {
            create: input.permissions.map((p) => ({
              permissionId: p.permissionId,
              scope: p.scope,
            })),
          },
        }),
      },
      include: ROLE_WITH_PERMISSIONS_INCLUDE,
    });
  });

  return transformRole(role);
}

/** ロールを削除 */
export async function deleteRole(id: string): Promise<void> {
  // ロールに紐づく管理者がいないか確認
  const userCount = await prisma.admin.count({
    where: { roleId: id },
  });

  if (userCount > 0) {
    throw new Error(
      `このロールは ${userCount} 人のユーザーに割り当てられているため削除できません`,
    );
  }

  await prisma.role.delete({
    where: { id },
  });
}

/** 全パーミッション定義を取得（マスタ） */
export async function getAllPermissions(): Promise<PermissionDefinition[]> {
  return prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
}
