import { PrismaClient, PermissionScope } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// タイムゾーンのバリエーション
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
// パーミッション定義（12 個: 3 resources × 4 actions）
// ---------------------------------------------------------------------------
const PERMISSION_DEFS = [
  { resource: "users", action: "read", description: "ユーザー閲覧" },
  { resource: "users", action: "create", description: "ユーザー作成" },
  { resource: "users", action: "update", description: "ユーザー更新" },
  { resource: "users", action: "delete", description: "ユーザー削除" },
  { resource: "stores", action: "read", description: "店舗閲覧" },
  { resource: "stores", action: "create", description: "店舗作成" },
  { resource: "stores", action: "update", description: "店舗更新" },
  { resource: "stores", action: "delete", description: "店舗削除" },
  { resource: "roles", action: "read", description: "ロール閲覧" },
  { resource: "roles", action: "create", description: "ロール作成" },
  { resource: "roles", action: "update", description: "ロール更新" },
  { resource: "roles", action: "delete", description: "ロール削除" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 既存のデータを削除（依存順序に注意）
  await prisma.store.deleteMany();
  await prisma.rolePermission.deleteMany();
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

  // パーミッション検索用マップ: "resource:action" → id
  const permMap = new Map<string, string>();
  for (const p of permissionRecords) {
    permMap.set(`${p.resource}:${p.action}`, p.id);
  }

  // ── ロール ──
  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "管理者 — 全リソースに対する全権限",
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: "USER",
      description: "一般ユーザー — 限定的な権限",
    },
  });
  console.log("✅ Created roles: ADMIN, USER");

  // ── ADMIN のパーミッション: 全 12 権限 (scope: ALL) ──
  await prisma.rolePermission.createMany({
    data: permissionRecords.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
      scope: PermissionScope.ALL,
    })),
  });

  // ── USER のパーミッション ──
  const userPermissions: { permissionKey: string; scope: PermissionScope }[] = [
    { permissionKey: "stores:read", scope: PermissionScope.ALL },
    { permissionKey: "users:read", scope: PermissionScope.OWN },
    { permissionKey: "users:update", scope: PermissionScope.OWN },
  ];

  await prisma.rolePermission.createMany({
    data: userPermissions.map((up) => ({
      roleId: userRole.id,
      permissionId: permMap.get(up.permissionKey)!,
      scope: up.scope,
    })),
  });
  console.log("✅ Assigned permissions to roles");

  // ── 管理者ユーザー ──
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      roleId: adminRole.id,
      timezone: "Asia/Hong_Kong",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created admin user (admin@example.com / admin123) [ADMIN]");

  // ── 一般ユーザー 50 名 ──
  const users = [];
  const defaultPassword = await bcrypt.hash("password", 10);
  for (let i = 0; i < 50; i++) {
    users.push({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      password: defaultPassword,
      roleId: userRole.id,
      timezone: TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)],
      emailVerified: Math.random() > 0.5 ? new Date() : null,
    });
  }

  // バッチで挿入（重複するメールアドレスはスキップ）
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${users.length} users with timezones`);

  // 店舗データを生成（公開パターンのバリエーション付き）
  const now = new Date();
  const stores = [];

  // 1. 即時公開（3件）
  for (let i = 0; i < 3; i++) {
    stores.push({
      name: `${faker.company.name()} ${["本店", "支店", "営業所"][i % 3]}`,
      description: faker.company.catchPhrase(),
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), // 30日前
      unpublishedAt: null, // 無期限
    });
  }

  // 2. まさに今公開（境界値テスト・2件）
  stores.push({
    name: `${faker.company.name()} 境界値テスト店A`,
    description: "まさに今公開される店舗（境界値テスト用）",
    address: `${faker.location.city()}${faker.location.street()}`,
    phone: faker.phone.number(),
    email: faker.internet.email().toLowerCase(),
    publishedAt: new Date(now.getTime() - 1000), // 1秒前
    unpublishedAt: null,
  });

  stores.push({
    name: `${faker.company.name()} 境界値テスト店B`,
    description: "まさに今公開される店舗（境界値テスト用）",
    address: `${faker.location.city()}${faker.location.street()}`,
    phone: faker.phone.number(),
    email: faker.internet.email().toLowerCase(),
    publishedAt: now, // 今
    unpublishedAt: null,
  });

  // 3. 1時間後公開（予約公開・3件）
  for (let i = 0; i < 3; i++) {
    stores.push({
      name: `${faker.company.name()} 予約公開店${i + 1}`,
      description: "1時間後に公開予定",
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: new Date(now.getTime() + 1000 * 60 * 60), // 1時間後
      unpublishedAt: null,
    });
  }

  // 4. 1秒後終了（境界値テスト・2件）
  stores.push({
    name: `${faker.company.name()} 終了間近店A`,
    description: "あと1秒で公開終了（境界値テスト用）",
    address: `${faker.location.city()}${faker.location.street()}`,
    phone: faker.phone.number(),
    email: faker.internet.email().toLowerCase(),
    publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1日前
    unpublishedAt: new Date(now.getTime() + 1000), // 1秒後
  });

  stores.push({
    name: `${faker.company.name()} 終了間近店B`,
    description: "まさに今公開終了（境界値テスト用）",
    address: `${faker.location.city()}${faker.location.street()}`,
    phone: faker.phone.number(),
    email: faker.internet.email().toLowerCase(),
    publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1日前
    unpublishedAt: now, // 今
  });

  // 5. 翌日公開（3件）
  for (let i = 0; i < 3; i++) {
    stores.push({
      name: `${faker.company.name()} 明日公開店${i + 1}`,
      description: "翌日に公開予定",
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: new Date(now.getTime() + 1000 * 60 * 60 * 24), // 翌日
      unpublishedAt: null,
    });
  }

  // 6. 期間限定公開（3件）
  for (let i = 0; i < 3; i++) {
    stores.push({
      name: `${faker.company.name()} 期間限定店${i + 1}`,
      description: "7日間限定公開",
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2日前
      unpublishedAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5), // 5日後
    });
  }

  // 7. 公開終了済み（2件）
  for (let i = 0; i < 2; i++) {
    stores.push({
      name: `${faker.company.name()} 公開終了店${i + 1}`,
      description: "公開終了済み",
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), // 30日前
      unpublishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), // 7日前
    });
  }

  // 8. 未設定（2件）
  for (let i = 0; i < 2; i++) {
    stores.push({
      name: `${faker.company.name()} 未公開店${i + 1}`,
      description: "公開日時未設定",
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      publishedAt: null,
      unpublishedAt: null,
    });
  }

  await prisma.store.createMany({
    data: stores,
  });

  console.log(`✅ Created ${stores.length} stores with publication dates`);

  // 作成されたデータのサンプルを表示
  const sampleUsers = await prisma.user.findMany({
    take: 3,
    include: { role: true },
  });

  const sampleStores = await prisma.store.findMany({
    take: 5,
  });

  const roleCount = await prisma.role.count();
  const permCount = await prisma.permission.count();
  const rpCount = await prisma.rolePermission.count();

  console.log("\n📊 Sample data:");
  console.log(
    `\n🔐 RBAC: ${roleCount} roles, ${permCount} permissions, ${rpCount} role-permissions`,
  );

  console.log("\n👥 Users:");
  sampleUsers.forEach((user) => {
    console.log(
      `  - ${user.name} (${user.email}) [${user.role.name}] [${user.timezone}]`,
    );
  });

  console.log("\n🏪 Stores:");
  sampleStores.forEach((store) => {
    const publishedAt = store.publishedAt
      ? store.publishedAt.toISOString()
      : "未設定";
    const unpublishedAt = store.unpublishedAt
      ? store.unpublishedAt.toISOString()
      : "無期限";
    console.log(
      `  - ${store.name} (公開: ${publishedAt}, 終了: ${unpublishedAt})`,
    );
  });

  console.log("\n✨ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
