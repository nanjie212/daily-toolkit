/**
 * 历史 Bug 清单抽查（docs/02-Bug清单与修复建议.md，QA 第二轮验证）。
 *
 * 抽查三类历史高危项，补齐 divisionGuards.test.ts 未覆盖的工具：
 *   输入校验：房贷负利率（Bug#2）、BMI 负数/超大值（Bug#4/#5）
 *   默认值污染：个税月薪 0 + 五险一金（Bug#1）、五险一金默认值
 *   日期/时区：日期计算器非法日期（Bug#6，parseLocalDate 防线）
 */
import { describe, it, expect } from 'vitest';
import {
  mortgageCalculator,
  taxCalculator,
  bmiCalculator,
  dateCalculator,
} from '@/tools/implementations/lifeTools';
import { socialInsuranceCalc } from '@/tools/implementations/financialTools';

describe('Bug#2 房贷计算器 - 负利率/零利率', () => {
  it('负利率被拒绝', async () => {
    const r = await mortgageCalculator({ principal: 1000000, rate: -5, years: 30 });
    expect(r.success).toBe(false);
    expect(r.error).toContain('年利率');
  });

  it('零利率等额本息为本金均摊，无 Infinity', async () => {
    const r = await mortgageCalculator({ principal: 120000, rate: 0, years: 10 });
    expect(r.success).toBe(true);
    const s = String(r.data);
    expect(s).toContain('每月还款: 1000.00元');
    expect(s).not.toContain('Infinity');
    expect(s).not.toContain('NaN');
  });

  it('非法本金被拒绝', async () => {
    expect((await mortgageCalculator({ principal: -1, rate: 3.5, years: 30 })).success).toBe(false);
    expect((await mortgageCalculator({ principal: 0, rate: 3.5, years: 30 })).success).toBe(false);
  });
});

describe('Bug#4/#5 BMI 计算器 - 负数与超大值', () => {
  it('负数体重被拒绝', async () => {
    const r = await bmiCalculator({ weight: -70, height: 175 });
    expect(r.success).toBe(false);
  });

  it('超大体重被拒绝（上限 500kg）', async () => {
    expect((await bmiCalculator({ weight: 999999, height: 175 })).success).toBe(false);
    expect((await bmiCalculator({ weight: 70, height: 99999 })).success).toBe(false);
  });

  it('正常输入照旧算对（70kg/175cm → BMI 22.9 正常）', async () => {
    const r = await bmiCalculator({ weight: 70, height: 175 });
    expect(r.success).toBe(true);
    expect(String(r.data)).toContain('22.9');
    expect(String(r.data)).toContain('正常');
  });
});

describe('Bug#1 个税计算器 - 月薪 0 与默认值污染', () => {
  it('月薪 0 报错，不再算出负数到手', async () => {
    const r = await taxCalculator({ salary: 0, socialInsurance: 2000 });
    expect(r.success).toBe(false);
    expect(r.error).toContain('请输入有效的税前月薪');
  });

  it('五险一金缺省时按 0 计，不再被默认值 2000 污染', async () => {
    const r = await taxCalculator({ salary: 8000 });
    expect(r.success).toBe(true);
    expect(String(r.data)).toContain('五险一金: 0元');
  });

  it('五险一金超过月薪被拒绝', async () => {
    const r = await taxCalculator({ salary: 5000, socialInsurance: 6000 });
    expect(r.success).toBe(false);
  });
});

describe('五险一金工具 - 边界输入', () => {
  it('工资 0 / 负数被拒绝', async () => {
    expect((await socialInsuranceCalc({ salary: 0 })).success).toBe(false);
    expect((await socialInsuranceCalc({ salary: -5000 })).success).toBe(false);
  });

  it('正常工资输出有限数字', async () => {
    const r = await socialInsuranceCalc({ salary: 10000 });
    expect(r.success).toBe(true);
    expect(JSON.stringify(r.data)).not.toContain('NaN');
    expect(JSON.stringify(r.data)).not.toContain('Infinity');
  });
});

describe('Bug#6 日期计算器 - 非法日期与时区', () => {
  it('拒绝 2024-02-30（不再静默顺延到 03-01）', async () => {
    const r = await dateCalculator({ mode: 'diff', date1: '2024-02-30', date2: '2024-03-05' });
    expect(r.success).toBe(false);
    expect(r.error).toContain('不是有效日期');
  });

  it('拒绝非闰年 2001-02-29', async () => {
    const r = await dateCalculator({ mode: 'diff', date1: '2001-02-29', date2: '2001-03-01' });
    expect(r.success).toBe(false);
  });

  it('合法日期差按本地时区计算（无 -1 天偏移）', async () => {
    const r = await dateCalculator({ mode: 'diff', date1: '2026-01-01', date2: '2026-01-08' });
    expect(r.success).toBe(true);
    expect(String(r.data)).toContain('相差: 7天');
  });
});
