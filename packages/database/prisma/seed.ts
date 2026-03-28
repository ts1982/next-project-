import { PrismaClient, PermissionScope, NotificationType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TIMEZONES = [
  "Asia/Tokyo",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "America/Los_Angeles",
  "Asia/Singapore",
  "Australia/Sydney",
  "Asia/Shanghai",
  "America/Chicago",
  "Europe/Berlin",
];

// ---------------------------------------------------------------------------
// パーミッション定義（admins/stores/roles/notifications）
// ---------------------------------------------------------------------------
const PERMISSION_DEFS = [
  { resource: "admins", action: "read", description: "管理者閲覧" },
  { resource: "admins", action: "create", description: "管理者作成" },
  { resource: "admins", action: "update", description: "管理者更新" },
  { resource: "admins", action: "delete", description: "管理者削除" },
  { resource: "stores", action: "read", description: "店舗閲覧" },
  { resource: "stores", action: "create", description: "店舗作成" },
  { resource: "stores", action: "update", description: "店舗更新" },
  { resource: "stores", action: "delete", description: "店舗削除" },
  { resource: "roles", action: "read", description: "ロール閲覧" },
  { resource: "roles", action: "create", description: "ロール作成" },
  { resource: "roles", action: "update", description: "ロール更新" },
  { resource: "roles", action: "delete", description: "ロール削除" },
  { resource: "notifications", action: "read", description: "通知閲覧" },
  { resource: "notifications", action: "create", description: "通知作成" },
  { resource: "notifications", action: "update", description: "通知更新" },
  { resource: "notifications", action: "delete", description: "通知削除" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 既存データを削除（依存順序に注意）
  await prisma.notification.deleteMany();
  await prisma.adminNotificationTarget.deleteMany();
  await prisma.adminNotification.deleteMany();
  await prisma.store.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  console.log("🗑️  Cleared existing data");

  // ── パーミッションマスタ ──
  const permissionRecords = await Promise.all(
    PERMISSION_DEFS.map((def) =>
      prisma.permission.create({
        data: def,
      }),
    ),
  );
  console.log(`✅ Created ${permissionRecords.length} permissions`);

  const permMap = new Map<string, string>();
  for (const p of permissionRecords) {
    permMap.set(`${p.resource}:${p.action}`, p.id);
  }

  // ── ロール ──
  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "管理者 — 全リソースに対する全権限",
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: "MANAGER",
      description: "マネージャー — 限定的な管理権限",
    },
  });
  console.log("✅ Created roles: ADMIN, MANAGER");

  // ── ADMIN のパーミッション: 全権限 (scope: ALL) ──
  await prisma.rolePermission.createMany({
    data: permissionRecords.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
      scope: PermissionScope.ALL,
    })),
  });

  // ── MANAGER のパーミッション ──
  const managerPermissions: { permissionKey: string; scope: PermissionScope }[] = [
    { permissionKey: "stores:read", scope: PermissionScope.ALL },
    { permissionKey: "stores:create", scope: PermissionScope.ALL },
    { permissionKey: "stores:update", scope: PermissionScope.ALL },
    { permissionKey: "admins:read", scope: PermissionScope.OWN },
    { permissionKey: "admins:update", scope: PermissionScope.OWN },
    { permissionKey: "notifications:read", scope: PermissionScope.ALL },
    { permissionKey: "notifications:create", scope: PermissionScope.ALL },
  ];

  await prisma.rolePermission.createMany({
    data: managerPermissions.map((mp) => ({
      roleId: managerRole.id,
      permissionId: permMap.get(mp.permissionKey)!,
      scope: mp.scope,
    })),
  });
  console.log("✅ Assigned permissions to roles");

  // ── 管理者ユーザー ──
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.admin.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      roleId: adminRole.id,
      timezone: "Asia/Tokyo",
    },
  });
  console.log("✅ Created admin user (admin@example.com / admin123) [ADMIN]");

  // ── 一般ユーザー（通知受信者）30名 ──
  const defaultPassword = await bcrypt.hash("password", 10);
  const userDataList = [];
  for (let i = 0; i < 30; i++) {
    userDataList.push({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      password: defaultPassword,
      timezone: TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)],
    });
  }
  // テスト用固定ユーザー
  userDataList.push({
    email: "user@example.com",
    name: "Test User",
    password: defaultPassword,
    timezone: "Asia/Tokyo",
  });

  await prisma.user.createMany({
    data: userDataList,
    skipDuplicates: true,
  });
  console.log(`✅ Created ${userDataList.length} users (user@example.com / password)`);

  // ── 店舗データ ──
  const now = new Date();
  const stores = [];
  for (let i = 0; i < 3; i++) {
    stores.push({
      name: `${faker.company.name()} ${["本店", "支店", "営業所"][i % 3]}`,
      description: faker.company.catchPhrase(),
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
      unpublishedAt: null,
    });
  }
  for (let i = 0; i < 2; i++) {
    stores.push({
      name: `${faker.company.name()} 予約公開店${i + 1}`,
      description: "1時間後に公開予定",
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: new Date(now.getTime() + 1000 * 60 * 60),
      unpublishedAt: null,
    });
  }

  await prisma.store.createMany({ data: stores });
  console.log(`✅ Created ${stores.length} stores`);

  console.log("\n✨ Seeding completed!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin app: admin@example.com / admin123");
  console.log("  User app:  user@example.com / password");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
