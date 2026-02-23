import { auth } from "../../../auth";

export class UnauthorizedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  timezone?: string | null;
}

export async function requireUser(): Promise<{ user: AuthUser }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      timezone: session.user.timezone,
    },
  };
}
