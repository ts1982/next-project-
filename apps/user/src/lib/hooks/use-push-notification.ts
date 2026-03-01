"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type PushPermissionState = "prompt" | "granted" | "denied" | "unsupported";

interface UsePushNotificationReturn {
  /** 現在の許可状態 */
  permission: PushPermissionState;
  /** サブスクリプション登録済みかどうか */
  isSubscribed: boolean;
  /** 処理中フラグ */
  isLoading: boolean;
  /** Push 通知を購読する */
  subscribe: () => Promise<void>;
  /** Push 通知の購読を解除する */
  unsubscribe: () => Promise<void>;
}

/**
 * URL-safe base64 を Uint8Array に変換（applicationServerKey 用）
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * VAPID 公開鍵をサーバーからランタイムで取得する。
 * NEXT_PUBLIC_* はビルド時インライン化されるため、Docker ビルド後の
 * 本番環境ではランタイム API 経由で取得する必要がある。
 */
let vapidKeyCache: string | undefined;

async function getVapidPublicKey(): Promise<string> {
  if (vapidKeyCache !== undefined) return vapidKeyCache;

  try {
    const res = await fetch("/api/push-config");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const key: string = data.vapidPublicKey || "";
    vapidKeyCache = key;
    return key;
  } catch (err) {
    console.error("[push] Failed to fetch VAPID public key:", err);
    return "";
  }
}

export function usePushNotification(): UsePushNotificationReturn {
  const [permission, setPermission] = useState<PushPermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // 初期化: Service Worker 登録 & 現在の状態確認
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        registrationRef.current = registration;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(subscription !== null);
      })
      .catch((err) => {
        console.error("[push] Service Worker registration failed:", err);
      });
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        console.warn("[push] VAPID public key not configured");
        return;
      }

      const registration =
        registrationRef.current ?? (await navigator.serviceWorker.ready);
      registrationRef.current = registration;

      // 通知許可をリクエスト
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);

      if (perm !== "granted") return;

      // Push サブスクリプション取得 or 作成
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublicKey,
          ) as BufferSource,
        });
      }

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys) {
        throw new Error("Invalid push subscription");
      }

      // サーバーに登録
      const res = await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("[push] Server response:", res.status, errorData);
        throw new Error(
          errorData?.error ??
            `Failed to register push subscription (${res.status})`,
        );
      }

      setIsSubscribed(true);
    } catch (err) {
      console.error("[push] Subscribe failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration =
        registrationRef.current ?? (await navigator.serviceWorker.ready);
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // サーバーから削除
        const res = await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error("[push] Unsubscribe server response:", res.status, errorData);
          throw new Error(
            errorData?.error ?? `Failed to unregister push subscription (${res.status})`,
          );
        }

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("[push] Unsubscribe failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
