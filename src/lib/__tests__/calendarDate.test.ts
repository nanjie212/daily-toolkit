/**
 * 日期合法性校验（isValidCalendarDate / isValidDateString / parseLocalDate）单测。
 *
 * 背景：JS 的 `new Date(2024, 1, 30)`（2024-02-30）不会报错，而是**静默顺延**
 * 到 2024-03-01；`new Date('2001-02-29')` 同样变成 2001-03-01。用户填错日期
 * 却拿到了一个看似正常的结果。这组用例锁死「非法日期必须被拒绝」的行为。
 */

import { describe, it, expect } from 'vitest';
import type { InputField } from '@/types';
import { isValidCalendarDate, isValidDateString, validateField } from '@/lib/validation';
import { parseLocalDate, isValidDateStr } from '@/lib/date';
import { validateInput } from '@/lib/validate';

describe('isValidCalendarDate', () => {
  it('接受真实存在的日期', () => {
    expect(isValidCalendarDate(2026, 8, 1)).toBe(true);
    expect(isValidCalendarDate(2024, 2, 29)).toBe(true); // 2024 是闰年
    expect(isValidCalendarDate(2000, 2, 29)).toBe(true); // 400 年闰
    expect(isValidCalendarDate(2026, 12, 31)).toBe(true);
  });

  it('拒绝被 JS 静默顺延的非法日期', () => {
    expect(isValidCalendarDate(2024, 2, 30)).toBe(false);
    expect(isValidCalendarDate(2001, 2, 29)).toBe(false); // 非闰年
    expect(isValidCalendarDate(1900, 2, 29)).toBe(false); // 百年不闰
    expect(isValidCalendarDate(2026, 4, 31)).toBe(false); // 4 月只有 30 天
  });

  it('拒绝越界的月 / 日', () => {
    expect(isValidCalendarDate(2026, 13, 1)).toBe(false);
    expect(isValidCalendarDate(2026, 0, 1)).toBe(false);
    expect(isValidCalendarDate(2026, 1, 0)).toBe(false);
    expect(isValidCalendarDate(2026, 1, 32)).toBe(false);
  });

  it('拒绝非整数输入', () => {
    expect(isValidCalendarDate(2026.5, 1, 1)).toBe(false);
    expect(isValidCalendarDate(2026, 1, NaN)).toBe(false);
  });
});

describe('isValidDateString / parseLocalDate', () => {
  it('合法字符串解析为本地零点，不因时区丢一天', () => {
    const d = parseLocalDate('2026-08-01');
    expect(d).not.toBeNull();
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(7);
    expect(d?.getDate()).toBe(1);
    expect(d?.getHours()).toBe(0);
  });

  it('非法日期与非法格式一律拒绝', () => {
    expect(isValidDateString('2024-02-30')).toBe(false);
    expect(isValidDateString('2001-02-29')).toBe(false);
    expect(isValidDateString('2026-8-1')).toBe(false); // 必须补零
    expect(isValidDateString('bad')).toBe(false);
    expect(isValidDateString(20260801)).toBe(false);
    expect(parseLocalDate('2024-02-30')).toBeNull();
  });

  it('date.ts 的 isValidDateStr 与 validation.ts 判定一致（同一份规则）', () => {
    for (const s of ['2026-08-01', '2024-02-29', '2024-02-30', '2001-02-29', 'bad']) {
      expect(isValidDateStr(s)).toBe(isValidDateString(s));
    }
  });
});

describe('validateField - date 真实性', () => {
  const dateField = { key: 'd', label: '日期', type: 'date', required: true } as InputField;

  it('格式对但日期不存在时报错', () => {
    expect(validateField(dateField, '2024-02-30')).toContain('真实存在');
    expect(validateField(dateField, '2001-02-29')).toContain('真实存在');
  });

  it('格式错误时优先提示格式', () => {
    expect(validateField(dateField, 'bad')).toContain('YYYY-MM-DD');
  });

  it('真实日期通过', () => {
    expect(validateField(dateField, '2024-02-29')).toBeNull();
  });
});

describe('validateField / validateInput - 非有限数', () => {
  const numField = { key: 'n', label: '数值', type: 'number', required: true } as InputField;

  it('Infinity 被拦下', () => {
    expect(validateField(numField, Infinity)).toContain('有限');
    expect(validateField(numField, -Infinity)).toContain('有限');
  });

  it('validateInput 同样拦截 Infinity 并支持 date 类型', () => {
    const outcome = validateInput(
      [
        { key: 'n', label: '数值', type: 'number', required: true },
        { key: 'd', label: '日期', type: 'date', required: true },
      ],
      { n: Infinity, d: '2024-02-30' }
    );
    expect(outcome.ok).toBe(false);
    expect(outcome.errors.n).toContain('有限');
    expect(outcome.errors.d).toContain('有效日期');
  });
});
