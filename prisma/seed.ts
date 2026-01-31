import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 既存のデータを削除
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing data");

  // ユーザーデータを生成
  const users = [];
  const defaultPassword = await bcrypt.hash("password", 10);
  for (let i = 0; i < 50; i++) {
    users.push({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      password: defaultPassword,
    });
  }

  // バッチで挿入（重複するメールアドレスはスキップ）
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${users.length} users`);

  // 店舗データを生成
  const stores = [];
  for (let i = 0; i < 20; i++) {
    stores.push({
      name: `${faker.company.name()} ${["本店", "支店", "営業所", "サービスセンター"][Math.floor(Math.random() * 4)]}`,
      description: faker.company.catchPhrase(),
      address: `${faker.location.city()}${faker.location.street()}`,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
    });
  }

  await prisma.store.createMany({
    data: stores,
  });

  console.log(`✅ Created ${stores.length} stores`);

  // 作成されたデータのサンプルを表示
  const sampleUsers = await prisma.user.findMany({
    take: 3,
  });

  const sampleStores = await prisma.store.findMany({
    take: 3,
  });

  console.log("\n📊 Sample data:");
  console.log("\n👥 Users:");
  sampleUsers.forEach((user) => {
    console.log(`  - ${user.name} (${user.email})`);
  });

  console.log("\n🏪 Stores:");
  sampleStores.forEach((store) => {
    console.log(`  - ${store.name} (${store.address})`);
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
