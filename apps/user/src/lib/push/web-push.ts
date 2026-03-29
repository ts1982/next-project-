import webpush from "web-push";

function getVapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} {
  return {
    publicKey: process.env.VAPID_PUBLIC_KEY || "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
    subject: process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  };
}

function ensureVapidConfigured(): boolean {
  const { publicKey, privateKey, subject } = getVapidConfig();
  if (!publicKey || !privateKey) {
    return false;
  }
  if (publicKey === "PLACEHOLDER" || privateKey === "PLACEHOLDER") {
    console.error(
      "[web-push] VAPID keys are placeholder values. Run: npx web-push generate-vapid-keys",
    );
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  type?: string;
  id?: string;
  url?: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushSendResult {
  endpoint: string;
  expired: boolean;
}

/**
 * 指定したサブスクリプションに Web Push を送信する
 * 失敗時は endpoint を返す（サブスクリプション削除用）
 */
export async function sendPushNotification(
  target: PushTarget,
  payload: PushPayload,
): Promise<PushSendResult> {
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 }, // 1時間
    );
    return { endpoint: target.endpoint, expired: false };
  } catch (error) {
    const statusCode = error instanceof webpush.WebPushError ? error.statusCode : 0;
    const isExpired = statusCode === 410 || statusCode === 404;
    if (!isExpired) {
      console.error("[web-push] Send failed:", error);
    }
    return { endpoint: target.endpoint, expired: isExpired };
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
    if (result.status === "fulfilled" && result.value.expired) {
      expiredEndpoints.push(result.value.endpoint);
    }
  }

  return expiredEndpoints;
}
