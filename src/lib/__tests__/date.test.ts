import { describe, it, expect } from 'vitest';
import { toLocalDateStr, parseLocalDate, isValidDateStr } from '@/lib/date';

describe('toLocalDateStr', () => {
  it('按本地年月日格式化，不丢一天', () => {
    expect(toLocalDateStr(new Date(2026, 7, 1))).toBe('2026-08-01');
    expect(toLocalDateStr(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
  it('个位月/日补零', () => {
    expect(toLocalDateStr(new Date(2026, 2, 3))).toBe('2026-03-03');
  });
});

describe('parseLocalDate', () => {
  it('合法日期按本地 0 点解析', () => {
    const d = parseLocalDate('2026-08-01');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(7);
    expect(d!.getDate()).toBe(1);
    expect(d!.getHours()).toBe(0); // 不会被当成 UTC 8:00
  });

  it('拒绝不存在的日期（如 2 月 30 日）', () => {
    expect(parseLocalDate('2026-02-30')).toBeNull();
    expect(parseLocalDate('2026-13-01')).toBeNull();
  });

  it('闰年校验', () => {
    expect(parseLocalDate('2024-02-29')).not.toBeNull(); // 闰年
    expect(parseLocalDate('2025-02-29')).toBeNull(); // 非闰年
  });

  it('拒绝格式非法 / 非字符串输入', () => {
    expect(parseLocalDate('2026-8-1')).toBeNull(); // 必须两位
    expect(parseLocalDate('abc')).toBeNull();
    expect(parseLocalDate('')).toBeNull();
    expect(parseLocalDate(null)).toBeNull();
    expect(parseLocalDate(undefined)).toBeNull();
    expect(parseLocalDate(123)).toBeNull();
  });
});

describe('isValidDateStr', () => {
  it('合法返回 true，非法返回 false', () => {
    expect(isValidDateStr('2026-08-01')).toBe(true);
    expect(isValidDateStr('2026-02-30')).toBe(false);
    expect(isValidDateStr('nope')).toBe(false);
  });
});
