"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10分

/**
 * 定期的にサーバーからパーミッションを再取得し、セッションを更新するProvider。
 * ロール変更が他の管理者によって行われた場合でも、最大10分で権限が反映される。
 */
export function PermissionRefreshProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const refresh = async () => {
      try {
        const res = await fetch("/api/auth/refresh-permissions", {
          method: "POST",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.user) {
            await update({ user: json.data.user });
          }
        }
      } catch {
        // リフレッシュ失敗はサイレントに無視（次回リトライ）
      }
    };

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session?.user?.id, update]);

  return <>{children}</>;
}
