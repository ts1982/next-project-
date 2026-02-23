import { toZonedTime, fromZonedTime, format } from "date-fns-tz";

/**
 * デフォルトタイムゾーン
 * 環境変数DEFAULT_TIMEZONEの値、または"Asia/Tokyo"
 */
export const DEFAULT_TIMEZONE =
  typeof process !== "undefined" && process.env.DEFAULT_TIMEZONE
    ? process.env.DEFAULT_TIMEZONE
    : "Asia/Tokyo";

/**
 * 代表的なタイムゾーン（約40個）
 * UI補助用の定数として使用
 */
export const POPULAR_TIMEZONES = [
  // アジア
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Ho_Chi_Minh",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Kathmandu",
  // ヨーロッパ
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Stockholm",
  "Europe/Moscow",
  "Europe/Istanbul",
  // アメリカ
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  // オセアニア
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  // アフリカ
  "Africa/Cairo",
  "Africa/Johannesburg",
] as const;

/**
 * IANAタイムゾーン文字列が有効かどうかを検証
 * 標準ライブラリで判定（自前のロジックは使わない）
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Intl.DateTimeFormatでタイムゾーンを検証
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * デフォルトタイムゾーンを取得（環境変数から）
 */
export function getDefaultTimezone(): string {
  return DEFAULT_TIMEZONE;
}

/**
 * ローカルタイム（タイムゾーン付き）をUTCに変換
 * @param dateTime - ローカルタイムのDate文字列またはDateオブジェクト
 * @param timezone - IANAタイムゾーン文字列
 * @returns UTC時刻のDateオブジェクト
 */
export function convertToUTC(dateTime: string | Date, timezone: string): Date {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  const localDate =
    typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  return fromZonedTime(localDate, timezone);
}

/**
 * UTC時刻をローカルタイム（タイムゾーン付き）に変換
 * @param utcDateTime - UTC時刻のDate文字列またはDateオブジェクト
 * @param timezone - IANAタイムゾーン文字列
 * @returns ローカルタイムのDateオブジェクト
 */
export function convertFromUTC(
  utcDateTime: string | Date,
  timezone: string,
): Date {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  const utcDate =
    typeof utcDateTime === "string" ? new Date(utcDateTime) : utcDateTime;
  return toZonedTime(utcDate, timezone);
}

/**
 * タイムゾーンのラベルをフォーマット
 * 例: "Asia/Tokyo (GMT+9)"
 */
export function formatTimezoneLabel(timezone: string): string {
  if (!isValidTimezone(timezone)) {
    return timezone;
  }

  try {
    // 現在時刻でのオフセットを取得
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");
    const offset = offsetPart ? offsetPart.value : "";

    return `${timezone} (${offset})`;
  } catch {
    return timezone;
  }
}

/**
 * タイムゾーンで日時をフォーマット
 * @param dateTime - フォーマットする日時
 * @param timezone - タイムゾーン
 * @param formatString - フォーマット文字列（date-fns形式）
 */
export function formatInTimezone(
  dateTime: Date | string,
  timezone: string,
  formatString: string = "yyyy/MM/dd HH:mm",
): string {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  const date = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, formatString, { timeZone: timezone });
}
