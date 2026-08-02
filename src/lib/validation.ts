import type { InputField } from '@/types';
import { isEmptyValue } from './numbers';

/**
 * 单字段校验。返回错误信息字符串；校验通过返回 null。
 *
 * 覆盖：
 *  - 必填（空字符串 / null / undefined / 空数组）
 *  - number 类型：必须为有限数字，且受 min / max 约束
 *  - date 类型：格式必须为 YYYY-MM-DD
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
    if (field.min !== undefined && n < field.min) {
      return `${field.label}不能小于 ${field.min}`;
    }
    if (field.max !== undefined && n > field.max) {
      return `${field.label}不能大于 ${field.max}`;
    }
  }

  if (field.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      return `${field.label}格式应为 YYYY-MM-DD`;
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
