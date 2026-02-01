import type { NextAuthConfig } from "next-auth";

// 保護されたルートの定義（一元管理）
const PROTECTED_PATHS = ["/dashboard", "/stores", "/users"] as const;

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 86400, // 1日（秒単位）
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user?.id;
      const pathname = nextUrl.pathname;

      const isProtectedRoute = PROTECTED_PATHS.some((path) =>
        pathname.startsWith(path),
      );

      const isAuthPage = pathname === "/login";

      if (isProtectedRoute && !isLoggedIn) {
        // 未認証で保護されたルートにアクセス → ログインページへ
        const callbackUrl = encodeURIComponent(nextUrl.href);
        return Response.redirect(
          new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl),
        );
      }

      if (isAuthPage && isLoggedIn) {
        // 認証済みでログインページにアクセス → ダッシュボードへ
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    async session({ session, token }) {
      // JWTトークンからセッションにユーザーIDとタイムゾーンを追加
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.timezone = token.timezone as string | null | undefined;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // 初回ログイン時
      if (user) {
        token.timezone = user.timezone;
      }
      // セッション更新時（update()が呼ばれた時）
      if (trigger === "update" && session?.user) {
        token.timezone = session.user.timezone;
      }
      return token;
    },
  },
  providers: [], // auth.tsで定義
} satisfies NextAuthConfig;
