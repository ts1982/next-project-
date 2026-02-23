import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      timezone?: string | null;
    };
  }

  interface User {
    id: string;
    timezone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    timezone?: string | null;
  }
}
