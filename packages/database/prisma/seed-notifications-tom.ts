import { PrismaClient, NotificationType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.SYSTEM,
  NotificationType.INFO,
  NotificationType.WARNING,
  NotificationType.PROMOTION,
];

const NOTIFICATION_TEMPLATES = [
  { title: "新しいプロモーションのお知らせ", body: "期間限定の特別割引をご利用ください。" },
  { title: "システムメンテナンスのお知らせ", body: "明日の深夜にメンテナンスを実施します。" },
  { title: "重要なセキュリティ情報", body: "パスワードの定期変更をお願いします。" },
  { title: "新機能リリースのお知らせ", body: "アプリが新機能でアップデートされました。" },
  { title: "キャンペーン開始のお知らせ", body: "ポイント2倍キャンペーンが始まりました。" },
  { title: "アカウント情報の更新", body: "お客様のアカウント情報が更新されました。" },
  { title: "ご利用ありがとうございます", body: "今月もご利用いただきありがとうございます。" },
  { title: "お得な情報をお届けします", body: "会員限定のお得な情報をご覧ください。" },
  { title: "サービス変更のお知らせ", body: "サービス内容が一部変更されます。" },
  { title: "ニュースレター", body: "今月のニュースレターをお届けします。" },
];

async function main() {
  console.log("🌱 tom@gmail.com 宛ダミー通知 100 件を作成します...");

  // ── tom@gmail.com ユーザーを取得 or 作成 ──
  let tom = await prisma.user.findUnique({ where: { email: "tom@gmail.com" } });
  if (!tom) {
    const hashedPassword = await bcrypt.hash("password", 10);
    tom = await prisma.user.create({
      data: {
        email: "tom@gmail.com",
        name: "Tom",
        password: hashedPassword,
        timezone: "Asia/Tokyo",
      },
    });
    console.log("✅ ユーザー tom@gmail.com を新規作成しました");
  } else {
    console.log("✅ 既存ユーザー tom@gmail.com を使用します");
  }

  // ── 管理者（createdBy）を取得 ──
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    throw new Error("管理者が存在しません。先に db:seed を実行してください。");
  }

  // ── 100 件の AdminNotification + Target + Notification を作成 ──
  const now = new Date();
  let created = 0;

  for (let i = 0; i < 100; i++) {
    const template = NOTIFICATION_TEMPLATES[i % NOTIFICATION_TEMPLATES.length];
    const type = NOTIFICATION_TYPES[i % NOTIFICATION_TYPES.length];

    // 過去 90 日以内のランダムな日時
    const createdAt = faker.date.recent({ days: 90, refDate: now });

    const adminNotification = await prisma.adminNotification.create({
      data: {
        createdByAdminId: admin.id,
        title: `${template.title}（#${i + 1}）`,
        body: `${template.body}\n\n${faker.lorem.sentences(2)}`,
        type,
        targetType: "SPECIFIC",
        deliveredAt: createdAt,
        createdAt,
        updatedAt: createdAt,
        targets: {
          create: { userId: tom.id },
        },
        notifications: {
          create: {
            userId: tom.id,
            title: `${template.title}（#${i + 1}）`,
            body: `${template.body}\n\n${faker.lorem.sentences(2)}`,
            type,
            isRead: Math.random() < 0.5,
            createdAt,
            updatedAt: createdAt,
          },
        },
      },
    });

    created++;
    if (created % 10 === 0) {
      console.log(`  📩 ${created} / 100 件完了...`);
    }
  }

  console.log(`\n✨ 完了！tom@gmail.com 宛に ${created} 件の通知を作成しました。`);
}

main()
  .catch((e) => {
    console.error("❌ エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
