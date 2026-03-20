import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

/**
 * ユーザーIDからロール + パーミッション文字列配列を取得する
 * "resource:action:scope" 形式（scope は lowercase）
 */
async function getUserPermissions(userId: string) {
  const { prisma } = await import("./src/lib/db/prisma");

  const admin = await prisma.admin.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          id: true,
          name: true,
          rolePermissions: {
            select: {
              scope: true,
              permission: {
                select: {
                  resource: true,
                  action: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!admin?.role) return { roleId: "", roleName: "", permissions: [] as string[] };

  const permissions = admin.role.rolePermissions.map(
    (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.scope.toLowerCase()}`,
  );

  return {
    roleId: admin.role.id,
    roleName: admin.role.name,
    permissions,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  cookies: {
    sessionToken: {
      name: "next-auth.admin.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
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

        // 管理者検索
        const admin = await prisma.admin.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!admin) {
          return null;
        }

        // パスワード検証
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
          return null;
        }

        // タイムゾーンが未設定の場合、デフォルト値を設定
        if (!admin.timezone) {
          await prisma.admin.update({
            where: { id: admin.id },
            data: { timezone: env.DEFAULT_TIMEZONE },
          });
        }

        // ロール + パーミッション文字列を取得
        const { roleId, roleName, permissions } = await getUserPermissions(admin.id);

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          image: admin.image,
          emailVerified: null,
          roleId,
          roleName,
          permissions,
          timezone: admin.timezone || env.DEFAULT_TIMEZONE,
        };
      },
    }),
  ],
});

// エクスポート: refresh-permissions API から呼べるように
export { getUserPermissions };
