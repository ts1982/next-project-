import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 既存のデータを削除
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing users");

  // ユーザーデータを生成
  const users = [];
  for (let i = 0; i < 50; i++) {
    users.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
    });
  }

  // バッチで挿入
  await prisma.user.createMany({
    data: users,
  });

  console.log(`✅ Created ${users.length} users`);

  // 作成されたユーザーの一部を表示
  const sampleUsers = await prisma.user.findMany({
    take: 5,
  });

  console.log("\n📊 Sample users:");
  sampleUsers.forEach((user) => {
    console.log(`  - ${user.name} (${user.email})`);
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
