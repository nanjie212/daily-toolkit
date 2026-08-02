import { describe, it, expect } from 'vitest';
import {
  isEmptyValue,
  num,
  isFiniteNumber,
  safeDivide,
  roundTo,
  str,
} from '@/lib/numbers';

describe('isEmptyValue', () => {
  it('将空字符串 / null / undefined / 空数组视为空', () => {
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue([])).toBe(true);
  });

  it('0、false、"0"、非空字符串不算空', () => {
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
    expect(isEmptyValue('0')).toBe(false);
    expect(isEmptyValue('abc')).toBe(false);
    expect(isEmptyValue([1])).toBe(false);
  });
});

describe('num', () => {
  it('缺值且无兜底时抛“必填”错误', () => {
    expect(() => num('')).toThrow('必填数值未填写');
    expect(() => num(undefined)).toThrow('必填数值未填写');
    expect(() => num(null)).toThrow('必填数值未填写');
  });

  it('缺值且提供了兜底时返回兜底值', () => {
    expect(num('', 5)).toBe(5);
    expect(num(undefined, 5)).toBe(5);
    expect(num(null, 0)).toBe(0);
  });

  // 关键回归：曾经 `Number(x) || default` 会把合法的 0 覆盖成默认值
  it('合法输入恰好为 0 时返回 0，而不是被兜底值覆盖', () => {
    expect(num('0')).toBe(0);
    expect(num(0)).toBe(0);
    expect(num('0', 99)).toBe(0);
  });

  it('字符串数字与小数正确转换', () => {
    expect(num('3')).toBe(3);
    expect(num('3.5')).toBe(3.5);
    expect(num('10', 99)).toBe(10);
    expect(num(42, 99)).toBe(42);
  });

  it('非法输入抛“有效数字”错误', () => {
    expect(() => num('abc')).toThrow('请输入有效的数字');
    expect(() => num('1.2.3')).toThrow('请输入有效的数字');
  });
});

describe('isFiniteNumber', () => {
  it('排除 NaN 与 Infinity', () => {
    expect(isFiniteNumber(1)).toBe(true);
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });
});

describe('safeDivide', () => {
  it('正常除法', () => {
    expect(safeDivide(10, 2)).toBe(5);
    expect(safeDivide(-6, 3)).toBe(-2);
  });
  it('除数为 0 或非法时返回 null，避免 Infinity', () => {
    expect(safeDivide(10, 0)).toBeNull();
    expect(safeDivide(Infinity, 2)).toBeNull();
    expect(safeDivide(10, Infinity)).toBeNull();
    expect(safeDivide(NaN, 2)).toBeNull();
  });
});

describe('roundTo', () => {
  it('消除经典浮点误差 0.1 + 0.2', () => {
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3);
  });
  it('按指定位数四舍五入', () => {
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(1.25, 1)).toBe(1.3);
    expect(roundTo(123.456, 0)).toBe(123);
    expect(roundTo(10 / 3, 2)).toBe(3.33);
  });
});

describe('str', () => {
  it('空值返回兜底', () => {
    expect(str('')).toBe('');
    expect(str(null, 'x')).toBe('x');
    expect(str(undefined)).toBe('');
  });
  it('非空值转字符串', () => {
    expect(str(5)).toBe('5');
    expect(str('hi')).toBe('hi');
  });
});
