import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { successResponse, errorResponse } from "@/lib/types/api.types";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const resetPasswordSchema = z.object({
  token: z.string().min(1, "トークンが必要です"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(PASSWORD_REGEX, "パスワードは英字と数字を含む必要があります"),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const POST = withApiHandler(async (request) => {
  const body = await request.json();
  const { token, password } = resetPasswordSchema.parse(body);

  const hashedToken = hashToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  });

  if (!resetToken) {
    return NextResponse.json(
      errorResponse("無効なリセットトークンです", undefined, "INVALID_TOKEN"),
      { status: 400 },
    );
  }

  if (resetToken.expiresAt < new Date()) {
    // 期限切れトークンを削除
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return NextResponse.json(
      errorResponse(
        "リセットトークンの有効期限が切れています。もう一度リクエストしてください",
        undefined,
        "TOKEN_EXPIRED",
      ),
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // パスワード更新 + トークン削除をトランザクションで実行
  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.deleteMany({ where: { email: resetToken.email } }),
  ]);

  return NextResponse.json(successResponse(null, "パスワードが正常にリセットされました"));
});
