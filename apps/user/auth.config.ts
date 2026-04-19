import type { NextAuthConfig } from "next-auth";

const PROTECTED_PATHS = ["/notifications"] as const;

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 86400,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user?.id;
      const pathname = nextUrl.pathname;

      const isProtectedRoute = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
      const isAuthPage =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password";

      if (isProtectedRoute && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.href);
        return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/notifications", nextUrl));
      }

      return true;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.timezone = token.timezone as string | null | undefined;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.timezone = user.timezone;
      }
      return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
