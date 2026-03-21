import { addDays as addDaysFns, differenceInSeconds, differenceInDays } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

const JST_TIMEZONE = "Asia/Tokyo";

/**
 * JSTでの今日の日付文字列 (YYYY-MM-DD) を取得
 * サーバー側でもクライアント側でも一貫してJSTの日付を返す
 */
export function getTodayInJST(): string {
  const now = new Date();
  return formatInTimeZone(now, JST_TIMEZONE, "yyyy-MM-dd");
}

/**
 * JSTでの日付範囲を取得（完了・スキップ判定用）
 * @param dateStr - YYYY-MM-DD形式の日付文字列
 * @returns JSTのその日の00:00:00〜23:59:59.999をUTC Dateオブジェクトで返す
 */
export function getDateRangeInJST(dateStr: string): { start: Date; end: Date } {
  // JSTのその日の00:00:00をUTCに変換
  const start = fromZonedTime(`${dateStr}T00:00:00`, JST_TIMEZONE);
  // JSTのその日の23:59:59.999をUTCに変換
  const end = fromZonedTime(`${dateStr}T23:59:59.999`, JST_TIMEZONE);
  return { start, end };
}

/**
 * DateオブジェクトをJSTのYYYY-MM-DD形式に変換
 * @param date - 変換する日付（省略時は現在時刻）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function formatDateToJST(date: Date = new Date()): string {
  return formatInTimeZone(date, JST_TIMEZONE, "yyyy-MM-dd");
}

/**
 * 日付に日数を加算（JST基準）
 * @param dateStr - YYYY-MM-DD形式の日付文字列
 * @param days - 加算する日数（負の値で減算）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function addDaysJST(dateStr: string, days: number): string {
  // 正午を使用してDST（サマータイム）の影響を回避
  const date = fromZonedTime(`${dateStr}T12:00:00`, JST_TIMEZONE);
  const newDate = addDaysFns(date, days);
  return formatInTimeZone(newDate, JST_TIMEZONE, "yyyy-MM-dd");
}

/**
 * YYYY-MM形式から月の開始・終了日時を取得（JST基準）
 * @param month - YYYY-MM形式の月文字列
 * @returns JSTのその月の開始・終了日時をUTC Dateオブジェクトで返す
 */
export function getMonthRangeInJST(month: string): { start: Date; end: Date } {
  const [year, monthNum] = month.split("-").map(Number);
  const firstDayStr = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const lastDayStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const start = fromZonedTime(`${firstDayStr}T00:00:00`, JST_TIMEZONE);
  const end = fromZonedTime(`${lastDayStr}T23:59:59.999`, JST_TIMEZONE);
  return { start, end };
}

/**
 * JSTで今日かどうかを判定
 * @param date - 判定する日付
 * @returns 今日の場合はtrue
 */
export function isTodayInJST(date: Date): boolean {
  const today = getTodayInJST();
  const dateStr = formatDateToJST(date);
  return today === dateStr;
}

/**
 * 表示用日付フォーマット（例：2024年1月15日（月））
 * @param date - フォーマットする日付
 * @returns 日本語形式の日付文字列
 */
export function formatDateForDisplay(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const zonedDate = toZonedTime(date, JST_TIMEZONE);
  const year = zonedDate.getFullYear();
  const month = zonedDate.getMonth() + 1;
  const day = zonedDate.getDate();
  const weekday = weekdays[zonedDate.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

/**
 * YYYY-MM-DD文字列からDateオブジェクトを作成（JSTとして解釈）
 * @param dateStr - YYYY-MM-DD形式の日付文字列
 * @returns UTC Date オブジェクト（JSTの正午として解釈）
 */
export function parseJSTDate(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T12:00:00`, JST_TIMEZONE);
}

/**
 * タスクの予定日ステータスを判定
 * @param scheduledAt - YYYY-MM-DD形式の日付文字列（nullの場合はnullを返す）
 * @returns "today" | "overdue" | "future" | null
 */
export function getScheduledDateStatus(scheduledAt: string | null | undefined): "today" | "overdue" | "future" | null {
  if (!scheduledAt) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduledDate = new Date(scheduledAt);
  scheduledDate.setHours(0, 0, 0, 0);

  if (scheduledDate.getTime() === today.getTime()) return "today";
  if (scheduledDate < today) return "overdue";
  return "future";
}

/**
 * Twitter風の相対日時表示
 * 60秒以内 → "N秒前"
 * 1時間以内 → "N分前"
 * 24時間以内 → "N時間前"
 * 7日以内 → "N日前"
 * それ以降 → "YYYY/MM/DD"
 */
export function formatRelativeDate(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diffSec = differenceInSeconds(new Date(), target);

  if (diffSec < 60) return `${diffSec}秒前`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}日前`;
  return formatInTimeZone(target, JST_TIMEZONE, "yyyy/MM/dd");
}

/**
 * 予定日（DATE型）の相対表示
 * 過去: 昨日 / N日前 / M/d
 * 今日: 今日
 * 未来: 明日 / N日後 / M/d
 */
export function formatRelativeScheduledDate(dateStr: string): string {
  const today = getTodayInJST();
  if (dateStr === today) return "今日";

  const todayDate = parseJSTDate(today);
  const targetDate = parseJSTDate(dateStr);
  const diffDays = differenceInDays(todayDate, targetDate); // 正=過去, 負=未来

  if (diffDays === 1) return "昨日";
  if (diffDays > 1 && diffDays < 7) return `${diffDays}日前`;
  if (diffDays === -1) return "明日";
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)}日後`;
  return formatInTimeZone(targetDate, JST_TIMEZONE, "M/d");
}

/**
 * DateオブジェクトをJSTのDateオブジェクトに変換（表示用）
 * @param date - 変換する日付
 * @returns JSTに変換されたDateオブジェクト
 */
export function toJSTDate(date: Date): Date {
  return toZonedTime(date, JST_TIMEZONE);
}

/**
 * 表示用日時フォーマット（例：2024年1月15日 14:30）
 * @param date - フォーマットする日付
 * @returns 日本語形式の日時文字列
 */
export function formatDateTimeForDisplay(date: Date): string {
  return formatInTimeZone(date, JST_TIMEZONE, "yyyy年M月d日 HH:mm");
}
