import webpush from "web-push";

function getVapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} {
  return {
    publicKey:
      process.env.VAPID_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
    subject: process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  };
}

function ensureVapidConfigured(): boolean {
  const { publicKey, privateKey, subject } = getVapidConfig();
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  type?: string;
  url?: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * 指定したサブスクリプションに Web Push を送信する
 * 失敗時は endpoint を返す（サブスクリプション削除用）
 */
export async function sendPushNotification(
  target: PushTarget,
  payload: PushPayload,
): Promise<{ success: boolean; endpoint: string }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 }, // 1時間
    );
    return { success: true, endpoint: target.endpoint };
  } catch (error) {
    const statusCode =
      error instanceof webpush.WebPushError ? error.statusCode : 0;
    // 410 Gone or 404 Not Found = サブスクリプション無効
    if (statusCode === 410 || statusCode === 404) {
      return { success: false, endpoint: target.endpoint };
    }
    console.error("[web-push] Send failed:", error);
    return { success: false, endpoint: target.endpoint };
  }
}

/**
 * 複数のサブスクリプションに一括送信する
 * 無効なサブスクリプションの endpoint 一覧を返す
 */
export async function sendPushNotifications(
  targets: PushTarget[],
  payload: PushPayload,
): Promise<string[]> {
  if (!ensureVapidConfigured()) {
    console.warn("[web-push] VAPID keys not configured, skipping push");
    return [];
  }

  const results = await Promise.allSettled(
    targets.map((target) => sendPushNotification(target, payload)),
  );

  const expiredEndpoints: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && !result.value.success) {
      expiredEndpoints.push(result.value.endpoint);
    }
  }

  return expiredEndpoints;
}
