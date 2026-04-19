import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { successResponse } from "@/lib/types/api.types";
import { sendPasswordResetEmail } from "@/lib/email/ses";

const TOKEN_EXPIRY_HOURS = 1;

const forgotPasswordSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください").toLowerCase().trim(),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const POST = withApiHandler(async (request) => {
  const body = await request.json();
  const { email } = forgotPasswordSchema.parse(body);

  // 期限切れトークンを一括削除
  await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // 同一メールの既存トークンを削除
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // トークン生成 → SHA-256 ハッシュを DB に保存
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      },
    });

    // リセットリンク送信
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (error) {
      console.error("Password reset email failed:", error);
      // メール送信失敗でもユーザーには同じレスポンスを返す
    }
  }

  // ユーザー存在有無に関わらず同じレスポンスを返す（情報漏洩防止）
  return NextResponse.json(
    successResponse(
      null,
      "メールアドレスが登録されている場合、パスワードリセット用のメールを送信しました",
    ),
  );
});
