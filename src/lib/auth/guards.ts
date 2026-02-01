import { auth } from "../../../auth";

/**
 * 認証エラー
 */
export class UnauthorizedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * 認証済みユーザーを取得する共通ガード関数
 * 未認証の場合はUnauthorizedErrorをthrowする
 *
 * @throws {UnauthorizedError} 未認証の場合
 * @returns 認証済みユーザー情報
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const user = await requireUser();
 *   // user.id, user.email, user.timezone などが利用可能
 * }
 * ```
 */
export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session.user;
}

/**
 * 認証済みセッション全体を取得する共通ガード関数
 * 未認証の場合はUnauthorizedErrorをthrowする
 *
 * @throws {UnauthorizedError} 未認証の場合
 * @returns 認証済みセッション情報
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const session = await requireSession();
 *   // session.user, session.expires などが利用可能
 * }
 * ```
 */
export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session;
}
