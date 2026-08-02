import { describe, it, expect } from 'vitest';
import type { InputField } from '@/types';
import { validateField, validateForm } from '@/lib/validation';

const requiredText = {
  key: 'name',
  label: '名称',
  type: 'text',
  required: true,
} as InputField;

const numField = {
  key: 'age',
  label: '年龄',
  type: 'number',
  required: true,
  min: 0,
  max: 120,
} as InputField;

const dateField = {
  key: 'd',
  label: '日期',
  type: 'date',
  required: true,
} as InputField;

const textLen = {
  key: 't',
  label: '备注',
  type: 'text',
  min: 2,
  max: 5,
} as InputField;

const optNum = {
  key: 'opt',
  label: '可选数',
  type: 'number',
  required: false,
  min: 1,
} as InputField;

describe('validateField - 必填', () => {
  it('必填文本为空报错', () => {
    expect(validateField(requiredText, '')).toContain('必填');
    expect(validateField(requiredText, null)).toContain('必填');
  });
  it('必填文本有值通过', () => {
    expect(validateField(requiredText, '张三')).toBeNull();
  });
});

describe('validateField - number 范围', () => {
  it('必填数值为空报错', () => {
    expect(validateField(numField, '')).toContain('必填');
  });
  it('超出 max 报错', () => {
    expect(validateField(numField, '150')).toContain('不能大于');
  });
  it('低于 min 报错', () => {
    expect(validateField(numField, '-5')).toContain('不能小于');
  });
  it('合法范围通过', () => {
    expect(validateField(numField, '30')).toBeNull();
  });
  it('非数字报错', () => {
    expect(validateField(numField, 'abc')).toContain('数字');
  });
});

describe('validateField - date 格式', () => {
  it('格式非法报错', () => {
    expect(validateField(dateField, 'bad')).toContain('YYYY-MM-DD');
  });
  it('格式合法通过', () => {
    expect(validateField(dateField, '2026-08-01')).toBeNull();
  });
});

describe('validateField - text 长度', () => {
  it('短于 min 报错', () => {
    expect(validateField(textLen, 'a')).toContain('至少');
  });
  it('长于 max 报错', () => {
    expect(validateField(textLen, '123456')).toContain('不能超过');
  });
  it('范围内通过', () => {
    expect(validateField(textLen, 'abc')).toBeNull();
  });
});

describe('validateField - 可选字段', () => {
  it('可选字段为空直接通过（不校验 min）', () => {
    expect(validateField(optNum, '')).toBeNull();
    expect(validateField(optNum, undefined)).toBeNull();
  });
  it('可选字段有值但越界仍报错', () => {
    expect(validateField(optNum, '0')).toContain('不能小于');
  });
});

describe('validateForm', () => {
  it('按 key 聚合所有错误', () => {
    const schema = [requiredText, numField];
    const errors = validateForm(schema, { name: '', age: '200' });
    expect(errors.name).toContain('必填');
    expect(errors.age).toContain('不能大于');
    expect(Object.keys(errors).length).toBe(2);
  });
  it('全部合法时返回空对象', () => {
    const schema = [requiredText, numField];
    const errors = validateForm(schema, { name: '张三', age: '30' });
    expect(errors).toEqual({});
  });
});
