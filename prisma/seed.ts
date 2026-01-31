import { PrismaClient } from "@prisma/client";
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

async function main() {
  console.log("🌱 Seeding database...");

  // 既存のデータを削除
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing data");

  // ユーザーデータを生成（タイムゾーン付き）
  const users = [];
  const defaultPassword = await bcrypt.hash("password", 10);
  for (let i = 0; i < 50; i++) {
    users.push({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      password: defaultPassword,
      timezone: TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)],
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
  });

  const sampleStores = await prisma.store.findMany({
    take: 5,
  });

  console.log("\n📊 Sample data:");
  console.log("\n👥 Users:");
  sampleUsers.forEach((user) => {
    console.log(`  - ${user.name} (${user.email}) [${user.timezone}]`);
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
