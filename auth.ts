import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // バリデーション
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Dynamic import to avoid Edge Runtime issues
        const { prisma } = await import("./src/lib/db/prisma");
        const { env } = await import("./src/lib/config/env");

        // ユーザー検索
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        // パスワード検証
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        // タイムゾーンが未設定の場合、デフォルト値を設定
        if (!user.timezone) {
          await prisma.user.update({
            where: { id: user.id },
            data: { timezone: env.DEFAULT_TIMEZONE },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
          timezone: user.timezone || env.DEFAULT_TIMEZONE,
        };
      },
    }),
  ],
});
