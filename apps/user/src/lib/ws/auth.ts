import { decode } from "next-auth/jwt";
import type { IncomingMessage } from "http";

const COOKIE_NAME = "next-auth.user.session-token";

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.split("=");
    if (key) {
      cookies[key.trim()] = decodeURIComponent(rest.join("=").trim());
    }
  }
  return cookies;
}

export async function authenticateWs(req: IncomingMessage): Promise<string | null> {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("[ws] AUTH_SECRET is not set");
    return null;
  }

  try {
    const decoded = await decode({ token, secret, salt: COOKIE_NAME });
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}
