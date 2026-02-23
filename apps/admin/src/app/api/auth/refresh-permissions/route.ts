import { NextResponse } from "next/server";
import { auth, getUserPermissions } from "../../../../../auth";
import { successResponse, errorResponse } from "@/lib/types/api.types";

/**
 * POST /api/auth/refresh-permissions
 *
 * DBから最新のパーミッションを取得し、セッションを更新するためのレスポンスを返す。
 * クライアント側で update() を呼んでJWTを更新する。
 *
 * @example
 * ```ts
 * const res = await fetch("/api/auth/refresh-permissions", { method: "POST" });
 * const data = await res.json();
 * await update(data.data); // NextAuth の update() でセッション更新
 * ```
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        errorResponse("認証が必要です", undefined, "UNAUTHORIZED"),
        { status: 401 },
      );
    }

    // DBから最新のパーミッションを取得
    const { roleId, roleName, permissions } = await getUserPermissions(
      session.user.id,
    );

    // クライアントはこのレスポンスを update() に渡す
    return NextResponse.json(
      successResponse({
        user: {
          roleId,
          roleName,
          permissions,
        },
      }),
    );
  } catch {
    return NextResponse.json(
      errorResponse("パーミッションの更新に失敗しました"),
      { status: 500 },
    );
  }
}
