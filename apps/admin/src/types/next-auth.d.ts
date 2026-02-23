import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleId: string;
      roleName: string;
      permissions: string[];
      timezone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    roleId?: string;
    roleName?: string;
    permissions?: string[];
    timezone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    roleId?: string;
    roleName?: string;
    permissions?: string[];
    timezone?: string | null;
  }
}
