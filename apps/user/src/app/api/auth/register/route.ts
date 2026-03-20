import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withApiHandler } from "@/lib/middleware/api-handler";
import { successResponse, errorResponse } from "@/lib/types/api.types";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください").toLowerCase().trim(),
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(100, "名前は100文字以内で入力してください")
    .trim(),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
      "パスワードは英字と数字を含む必要があります",
    ),
});

export const POST = withApiHandler(async (request) => {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
    });
    return NextResponse.json(
      errorResponse("バリデーションエラー", fieldErrors, "VALIDATION_ERROR"),
      { status: 400 },
    );
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      errorResponse(
        "このメールアドレスは既に使用されています",
        { email: "このメールアドレスは既に使用されています" },
        "DUPLICATE_EMAIL",
      ),
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json(successResponse({ user }, "アカウントが作成されました"), {
    status: 201,
  });
});
