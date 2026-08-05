/**
 * 计算类工具的「除零 / 非法日期」守卫回归测试。
 *
 * 这几条断言对应本次修复的真实缺陷：
 *   1. 分数计算器把 '1/0' 里的 0 分母用 `den || 1` 悄悄改写成 1，算出错误结果。
 *   2. 提前还款计算器在零利率时 `Math.pow(1+0,n)-1 === 0`，直接除零得到 Infinity。
 *   3. 定投计算器在本金与月投都为 0 时 `pureReturn / totalInvested` 得到 NaN。
 *   4. 多个日期类工具用 `new Date(str)`，'2024-02-30' 被静默顺延为 03-01。
 */

import { describe, it, expect } from 'vitest';
import { fractionCalculator } from '@/tools/implementations/measurementTools';
import { earlyRepaymentCalc, investmentReturnCalc } from '@/tools/implementations/financialTools';
import { dueDateCalc } from '@/tools/implementations/healthTools';
import { periodTrackerCalc } from '@/tools/implementations/lifeUtilityTools';
import { workingDaysCalc, lunarCalendarQuery } from '@/tools/implementations/datetimeTools';
import { timezoneConverter } from '@/tools/implementations/lifeTools';

describe('fractionCalculator - 分母守卫', () => {
  it('分母为 0 时报错，而不是当成 1', async () => {
    const r = await fractionCalculator({ fraction1: '1/0', fraction2: '1/2', op: 'add' });
    expect(r.success).toBe(false);
    expect(r.error).toContain('分母不能为零');
  });

  it('第二个分数分母为 0 时同样报错', async () => {
    const r = await fractionCalculator({ fraction1: '1/2', fraction2: '3/0', op: 'add' });
    expect(r.success).toBe(false);
  });

  it('除以 0 分子时报错', async () => {
    const r = await fractionCalculator({ fraction1: '1/2', fraction2: '0/5', op: 'divide' });
    expect(r.success).toBe(false);
    expect(r.error).toContain('除零');
  });

  it('非数字输入报错而不是算出 NaN', async () => {
    const r = await fractionCalculator({ fraction1: 'a/b', fraction2: '1/2', op: 'add' });
    expect(r.success).toBe(false);
  });

  it('正常分数照旧算对（无回归）', async () => {
    const r = await fractionCalculator({ fraction1: '1/2', fraction2: '1/3', op: 'add' });
    expect(r.success).toBe(true);
    expect((r.data as Record<string, string>).结果).toBe('5/6');
  });
});

describe('earlyRepaymentCalc - 零利率除零守卫', () => {
  it('利率为 0 时输出有限数字而非 Infinity', async () => {
    const r = await earlyRepaymentCalc({ remaining: 120000, rate: 0, remainYears: 10, prepay: 20000 });
    expect(r.success).toBe(true);
    const data = r.data as Record<string, string>;
    // 120000 / 120 期 = 1000 元/月
    expect(data.原月供).toBe('¥1000.00');
    expect(JSON.stringify(data)).not.toContain('Infinity');
    expect(JSON.stringify(data)).not.toContain('NaN');
  });

  it('剩余年限为 0 时报错而不是算出 NaN', async () => {
    const r = await earlyRepaymentCalc({ remaining: 120000, rate: 3.5, remainYears: 0, prepay: 20000 });
    expect(r.success).toBe(false);
  });
});

describe('investmentReturnCalc - 投入总额为零守卫', () => {
  it('本金与月投都为 0 时报错而不是输出 NaN%', async () => {
    const r = await investmentReturnCalc({ principal: 0, monthly: 0, rate: 4, years: 5 });
    expect(r.success).toBe(false);
  });

  it('正常输入无 NaN', async () => {
    const r = await investmentReturnCalc({ principal: 10000, monthly: 500, rate: 4, years: 5 });
    expect(r.success).toBe(true);
    expect(JSON.stringify(r.data)).not.toContain('NaN');
  });
});

describe('日期类工具 - 拒绝被顺延的非法日期', () => {
  it('dueDateCalc 拒绝 2024-02-30', async () => {
    const r = await dueDateCalc({ lmp: '2024-02-30' });
    expect(r.success).toBe(false);
  });

  it('periodTrackerCalc 拒绝 2001-02-29', async () => {
    const r = await periodTrackerCalc({ lastDate: '2001-02-29', cycleDays: 28, periodDays: 5 });
    expect(r.success).toBe(false);
  });

  it('workingDaysCalc 拒绝非法日期并限制天数上限', async () => {
    expect((await workingDaysCalc({ start: '2026-04-31', days: 10 })).success).toBe(false);
    expect((await workingDaysCalc({ start: '2026-01-01', days: 99999999 })).success).toBe(false);
    expect((await workingDaysCalc({ start: '2026-01-01', days: 10 })).success).toBe(true);
  });

  it('lunarCalendarQuery 拒绝非法日期，留空则查今天', async () => {
    expect((await lunarCalendarQuery({ date: '2024-02-30' })).success).toBe(false);
    expect((await lunarCalendarQuery({ date: '' })).success).toBe(true);
  });
});

/**
 * timezoneConverter 收的是「带时间的串」，不能直接套 parseLocalDate。
 * 修复前 `isNaN(new Date('2024-02-30 10:00').getTime())` 为 false —— 非法日期
 * 不会变 Invalid Date，而是顺延到 03-01，用户拿到一个看着完全正常的换算结果。
 */
describe('timezoneConverter - 日期真实性 + 时间分量校验', () => {
  it('拒绝被顺延的非法日期（回归：修复前会返回 03-01 的换算结果）', async () => {
    const r = await timezoneConverter({ datetime: '2024-02-30 10:00' });
    expect(r.success).toBe(false);
    expect(r.error).toContain('不是有效日期');
  });

  it('拒绝非闰年 2-29', async () => {
    expect((await timezoneConverter({ datetime: '2001-02-29 10:00' })).success).toBe(false);
  });

  it('拒绝越界的时 / 分', async () => {
    expect((await timezoneConverter({ datetime: '2026-01-01 25:00' })).success).toBe(false);
    expect((await timezoneConverter({ datetime: '2026-01-01 10:99' })).success).toBe(false);
  });

  it('拒绝缺时间段 / 格式错乱的输入', async () => {
    expect((await timezoneConverter({ datetime: '2026-01-01' })).success).toBe(false);
    expect((await timezoneConverter({ datetime: 'bad' })).success).toBe(false);
  });

  it('合法输入照常换算（无回归）', async () => {
    const r = await timezoneConverter({ datetime: '2026-01-01 10:00' });
    expect(r.success).toBe(true);
    expect(String(r.data)).toContain('北京时间');
  });

  it('闰年 2-29 与 T 分隔、带秒的写法均可用', async () => {
    expect((await timezoneConverter({ datetime: '2024-02-29 10:00' })).success).toBe(true);
    expect((await timezoneConverter({ datetime: '2026-01-01T10:00' })).success).toBe(true);
    expect((await timezoneConverter({ datetime: '2026-01-01 10:00:30' })).success).toBe(true);
  });
});
