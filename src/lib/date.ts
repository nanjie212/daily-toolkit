import { isValidCalendarDate } from './validation';

/**
 * 将 Date 格式化为本地时区的 YYYY-MM-DD 字符串。
 *
 * 不要用 Date.toISOString().split('T')[0] 来显示用户可见的日历日期：
 * toISOString() 返回的是 UTC 时间，在中国时区（UTC+8）会把本地零点
 * 的日期当成前一天，导致显示少一天。本函数始终按本地年月日输出。
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 将 YYYY-MM-DD 字符串按本地时区零点解析为 Date。
 *
 * 与 toLocalDateStr 互补：严格校验格式（必须为 4-2-2 位数字）与真实存在的日期
 * （如 2 月 30 日、13 月、非闰年 2 月 29 日均返回 null）。非字符串输入返回 null。
 * 解析成功时返回本地 0 点的 Date（getHours() === 0），不会因时区偏移丢一天。
 *
 * 日期合法性判定统一委托给 `validation.ts` 的 `isValidCalendarDate`，
 * 全项目只保留这一份「日期是否真实存在」的规则。
 */
export function parseLocalDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) return null;

  return new Date(year, month - 1, day);
}

/**
 * 判断给定值是否为合法的 YYYY-MM-DD 日期字符串。
 */
export function isValidDateStr(value: unknown): boolean {
  return parseLocalDate(value) !== null;
}
