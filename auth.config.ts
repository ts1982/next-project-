import type { NextAuthConfig } from "next-auth";
import type { Resource, Action } from "./src/lib/auth/permissions";
import { checkPermission } from "./src/lib/auth/permissions";

// ---------------------------------------------------------------------------
// ルート保護定義
// ---------------------------------------------------------------------------

/** 認証が必要なルート */
const PROTECTED_PATHS = ["/dashboard", "/stores", "/users", "/roles"] as const;

/**
 * ルートごとに必要なパーミッション
 * パスの prefix でマッチし、該当パーミッションがなければダッシュボードへリダイレクト
 */
const ROUTE_PERMISSIONS: {
  path: string;
  resource: Resource;
  action: Action;
}[] = [
  { path: "/users", resource: "users", action: "read" },
  { path: "/stores", resource: "stores", action: "read" },
  { path: "/roles", resource: "roles", action: "read" },
];

// ---------------------------------------------------------------------------
// NextAuth Config
// ---------------------------------------------------------------------------

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

      const isProtectedRoute = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

      const isAuthPage = pathname === "/login";

      if (isProtectedRoute && !isLoggedIn) {
        // 未認証で保護されたルートにアクセス → ログインページへ
        const callbackUrl = encodeURIComponent(nextUrl.href);
        return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
      }

      // パーミッションベースのルート保護
      if (isLoggedIn) {
        const permissions: string[] =
          ((auth?.user as unknown as Record<string, unknown>)?.permissions as string[]) ?? [];

        const requiredPerm = ROUTE_PERMISSIONS.find((rp) => pathname.startsWith(rp.path));
        if (requiredPerm) {
          const scope = checkPermission(permissions, requiredPerm.resource, requiredPerm.action);
          if (!scope) {
            // 権限なし → ダッシュボードへリダイレクト
            return Response.redirect(new URL("/dashboard", nextUrl));
          }
        }
      }

      if (isAuthPage && isLoggedIn) {
        // 認証済みでログインページにアクセス → ダッシュボードへ
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roleId = (token.roleId as string) ?? "";
        session.user.roleName = (token.roleName as string) ?? "";
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.timezone = token.timezone as string | null | undefined;
      }
      return session;
    },

    async jwt({ token, user, trigger, session }) {
      // 初回ログイン時
      if (user) {
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.permissions = user.permissions;
        token.timezone = user.timezone;
      }
      // セッション更新時（update()が呼ばれた時）
      if (trigger === "update" && session?.user) {
        token.timezone = session.user.timezone;
        // パーミッション更新（refresh-permissions から呼ばれる）
        if (session.user.permissions) {
          token.roleId = session.user.roleId;
          token.roleName = session.user.roleName;
          token.permissions = session.user.permissions;
        }
      }
      return token;
    },
  },
  providers: [], // auth.tsで定義
} satisfies NextAuthConfig;
