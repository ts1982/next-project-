import { formatInTimezone, getDefaultTimezone } from "./timezone";

/**
 * 公開状態を計算する（唯一の真実）
 * is_public = now_utc >= published_at AND (unpublished_at IS NULL OR now_utc < unpublished_at)
 */
export function calculateIsPublic(
  publishedAt: Date | string | null,
  unpublishedAt: Date | string | null,
  now: Date = new Date(),
): boolean {
  // publishedAtがnullの場合は未公開
  if (!publishedAt) {
    return false;
  }

  const publishedDate = typeof publishedAt === "string" ? new Date(publishedAt) : publishedAt;
  const nowTime = now.getTime();

  // 公開開始日時前の場合は未公開
  if (nowTime < publishedDate.getTime()) {
    return false;
  }

  // unpublishedAtがnullの場合は無期限公開
  if (!unpublishedAt) {
    return true;
  }

  const unpublishedDate =
    typeof unpublishedAt === "string" ? new Date(unpublishedAt) : unpublishedAt;

  // 公開終了日時前の場合は公開中
  return nowTime < unpublishedDate.getTime();
}

/**
 * 公開状態のステータスを取得（日本語）
 * - "公開中"
 * - "予約公開 YYYY/MM/DD HH:mm (JST)"
 * - "公開終了"
 * - "未設定"
 */
export function getPublicationStatus(
  publishedAt: Date | string | null,
  unpublishedAt: Date | string | null,
  timezone?: string,
  now: Date = new Date(),
): string {
  const tz = timezone || getDefaultTimezone();

  // publishedAtがnullの場合は未設定
  if (!publishedAt) {
    return "未設定";
  }

  const publishedDate = typeof publishedAt === "string" ? new Date(publishedAt) : publishedAt;
  const nowTime = now.getTime();

  // 公開開始日時前の場合は予約公開
  if (nowTime < publishedDate.getTime()) {
    const formattedDate = formatPublicationDate(publishedDate, tz);
    return `予約公開 ${formattedDate}`;
  }

  // unpublishedAtがnullの場合は無期限公開中
  if (!unpublishedAt) {
    return "公開中";
  }

  const unpublishedDate =
    typeof unpublishedAt === "string" ? new Date(unpublishedAt) : unpublishedAt;

  // 公開終了日時前の場合は公開中
  if (nowTime < unpublishedDate.getTime()) {
    return "公開中";
  }

  // 公開終了
  return "公開終了";
}

/**
 * 公開日時をフォーマット
 * 例: "2026/02/15 10:00 (JST)"
 */
export function formatPublicationDate(dateTime: Date | string, timezone?: string): string {
  const tz = timezone || getDefaultTimezone();
  const date = typeof dateTime === "string" ? new Date(dateTime) : dateTime;

  // タイムゾーンの略称を取得
  const tzAbbr = getTimezoneAbbreviation(tz);
  const formatted = formatInTimezone(date, tz, "yyyy/MM/dd HH:mm");

  return `${formatted} (${tzAbbr})`;
}

/**
 * タイムゾーンの略称を取得
 * 例: Asia/Tokyo → JST, America/New_York → EST/EDT
 */
function getTimezoneAbbreviation(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });

    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((part) => part.type === "timeZoneName");

    return tzPart?.value || timezone.split("/").pop() || timezone;
  } catch {
    return timezone;
  }
}

/**
 * 公開期間の整合性をチェック
 * unpublishedAtがpublishedAtより後であることを確認
 */
export function validatePublicationPeriod(
  publishedAt: Date | string | null,
  unpublishedAt: Date | string | null,
): boolean {
  // どちらかがnullの場合はOK
  if (!publishedAt || !unpublishedAt) {
    return true;
  }

  const publishedDate = typeof publishedAt === "string" ? new Date(publishedAt) : publishedAt;
  const unpublishedDate =
    typeof unpublishedAt === "string" ? new Date(unpublishedAt) : unpublishedAt;

  // unpublishedAtがpublishedAtより後であること
  return unpublishedDate.getTime() > publishedDate.getTime();
}
