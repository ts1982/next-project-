/**
 * VAPID キー生成スクリプト
 * 実行: npx tsx apps/user/scripts/generate-vapid-keys.ts
 *
 * 生成された値を .env に設定してください:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:admin@example.com
 */
import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();

console.log("=== VAPID Keys Generated ===\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@example.com`);
console.log("\n上記の値を apps/user/.env に追加してください。");
