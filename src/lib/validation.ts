import type { InputField } from '@/types';
import { isEmptyValue } from './numbers';

/** YYYY-MM-DD 的纯格式匹配（不保证日期真实存在） */
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 判断「年 / 月 / 日」三元组是否为真实存在的日历日期。
 *
 * 为什么需要它：JS 的 `new Date(2024, 1, 30)`（即 2024-02-30）不会报错，
 * 而是**静默顺延**到 2024-03-01；`new Date('2001-02-29')` 同样会变成
 * 2001-03-01。用户填错日期时没有任何提示，却拿到了错误的计算结果。
 *
 * 做法：按本地时区构造 Date 后把年 / 月 / 日回比一遍，只要有一项对不上，
 * 说明发生了顺延，即为非法日期。
 *
 * @example
 * isValidCalendarDate(2024, 2, 29) // true （2024 是闰年）
 * isValidCalendarDate(2001, 2, 29) // false（2001 非闰年）
 * isValidCalendarDate(2024, 2, 30) // false
 * isValidCalendarDate(2024, 13, 1) // false
 */
export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  // 先做粗筛，避免把 -1 月 / 第 40 天这类明显越界的值交给 Date 去“修正”
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

/**
 * 判断一个值是否为**格式合法且真实存在**的 YYYY-MM-DD 日期字符串。
 *
 * 与只做正则匹配的写法不同，'2024-02-30' / '2001-02-29' / '2024-13-01'
 * 都会被判为 false。
 */
export function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  return isValidCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/**
 * 单字段校验。返回错误信息字符串；校验通过返回 null。
 *
 * 覆盖：
 *  - 必填（空字符串 / null / undefined / 空数组）
 *  - number 类型：必须为有限数字（拒绝 NaN / Infinity），且受 min / max 约束
 *  - date 类型：格式必须为 YYYY-MM-DD，且必须是真实存在的日期
 *  - text / textarea：字符长度受 min / max 约束
 */
export function validateField(field: InputField, value: unknown): string | null {
  const empty = isEmptyValue(value);

  if (field.required && empty) {
    return `${field.label}为必填项`;
  }
  // 可选字段且为空：直接通过，无需进一步校验
  if (empty) return null;

  if (field.type === 'number') {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) {
      return `${field.label}必须是数字`;
    }
    // Infinity / -Infinity 参与四则运算会污染整条计算链，一并拦掉
    if (!Number.isFinite(n)) {
      return `${field.label}必须是有限数字`;
    }
    if (field.min !== undefined && n < field.min) {
      return `${field.label}不能小于 ${field.min}`;
    }
    if (field.max !== undefined && n > field.max) {
      return `${field.label}不能大于 ${field.max}`;
    }
  }

  if (field.type === 'date') {
    const s = String(value);
    if (!DATE_PATTERN.test(s)) {
      return `${field.label}格式应为 YYYY-MM-DD`;
    }
    if (!isValidDateString(s)) {
      return `${field.label}不是真实存在的日期`;
    }
  }

  if (field.type === 'text' || field.type === 'textarea') {
    const s = String(value);
    if (field.min !== undefined && s.length < field.min) {
      return `${field.label}至少需要 ${field.min} 个字符`;
    }
    if (field.max !== undefined && s.length > field.max) {
      return `${field.label}不能超过 ${field.max} 个字符`;
    }
  }

  return null;
}

/** 整表校验，返回 { 字段key: 错误信息 } */
export function validateForm(
  schema: InputField[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of schema) {
    const err = validateField(field, values[field.key]);
    if (err) errors[field.key] = err;
  }
  return errors;
}
