import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 既存のデータを削除
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing users");

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
