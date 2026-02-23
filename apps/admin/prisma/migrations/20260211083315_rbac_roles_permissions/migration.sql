-- ==========================================================================
-- Migration: RBAC (Role-Based Access Control)
-- Replaces: enum Role { ADMIN, USER } on users table
-- With: roles, permissions, role_permissions tables + users.roleId FK
-- ==========================================================================

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('ALL', 'OWN');

-- 1) Create new tables FIRST (before touching users)
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'ALL',
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- FK on role_permissions
ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Seed the two default roles so we can reference them
INSERT INTO "roles" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
  ('role_admin', 'ADMIN', '管理者 — 全リソースの全操作', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role_user',  'USER',  '一般ユーザー — 閲覧中心の限定操作', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3) Add roleId column (nullable first) and migrate existing data
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

UPDATE "users" SET "roleId" = 'role_admin' WHERE "role" = 'ADMIN';
UPDATE "users" SET "roleId" = 'role_user'  WHERE "role" = 'USER';
-- Fallback: any remaining NULLs get USER role
UPDATE "users" SET "roleId" = 'role_user'  WHERE "roleId" IS NULL;

-- 4) Make roleId NOT NULL and drop old role column
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "users" DROP COLUMN "role";

-- 5) Drop old enum
DROP TYPE "Role";

-- 6) FK on users.roleId
ALTER TABLE "users"
  ADD CONSTRAINT "users_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
