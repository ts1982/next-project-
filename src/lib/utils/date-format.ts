import { formatInTimezone } from "./timezone";

/**
 * 日時をタイムゾーン付きでフォーマットする共通ユーティリティ
 * すべての日時表示でタイムゾーンを統一的に扱う
 */

/**
 * 標準の日時フォーマット（タイムゾーン表示付き）
 * 例: "2024/01/15 14:30 JST"
 */
export function formatDateTime(date: Date | string, timezone: string): string {
  const formatted = formatInTimezone(date, timezone, "yyyy/MM/dd HH:mm");
  const abbreviation = getTimezoneAbbreviation(timezone);
  return `${formatted} ${abbreviation}`;
}

/**
 * 日付のみフォーマット（タイムゾーン表示付き）
 * 例: "2024/01/15 JST"
 */
export function formatDate(date: Date | string, timezone: string): string {
  const formatted = formatInTimezone(date, timezone, "yyyy/MM/dd");
  const abbreviation = getTimezoneAbbreviation(timezone);
  return `${formatted} ${abbreviation}`;
}

/**
 * 時刻のみフォーマット（タイムゾーン表示付き）
 * 例: "14:30 JST"
 */
export function formatTime(date: Date | string, timezone: string): string {
  const formatted = formatInTimezone(date, timezone, "HH:mm");
  const abbreviation = getTimezoneAbbreviation(timezone);
  return `${formatted} ${abbreviation}`;
}

/**
 * 詳細な日時フォーマット（秒まで、タイムゾーン表示付き）
 * 例: "2024/01/15 14:30:45 JST"
 */
export function formatDateTimeDetailed(
  date: Date | string,
  timezone: string,
): string {
  const formatted = formatInTimezone(date, timezone, "yyyy/MM/dd HH:mm:ss");
  const abbreviation = getTimezoneAbbreviation(timezone);
  return `${formatted} ${abbreviation}`;
}

/**
 * 詳細な日時フォーマット（秒まで、完全なタイムゾーン名を括弧付きで表示）
 * 例: "2024/01/15 14:30:45 (Asia/Tokyo)"
 */
export function formatDateTimeWithZone(
  date: Date | string,
  timezone: string,
): string {
  const formatted = formatInTimezone(date, timezone, "yyyy/MM/dd HH:mm:ss");
  return `${formatted} (${timezone})`;
}

/**
 * タイムゾーンの略称を取得
 * 例: "Asia/Tokyo" → "JST"
 */
function getTimezoneAbbreviation(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });

    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find((part) => part.type === "timeZoneName");

    return timeZonePart?.value || timezone;
  } catch {
    return timezone;
  }
}
