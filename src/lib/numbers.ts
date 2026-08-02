/**
 * 安全的数值取值工具。
 *
 * 之前大量工具使用 `Number(input.x) || default` 的写法，存在两个隐患：
 *  1. 当输入为空字符串 / null / undefined 时，会悄悄用 default 计算，
 *     用户以为算的是自己的数据，实际用了默认值（隐性错误）。
 *  2. 当输入合法但恰好为 0 时，`0 || default` 会把 0 也当成“假值”覆盖成 default，
 *     例如利率填 0 会被当成 4%、折扣 0 会被当成别的数字。
 *
 * 本模块用「显式判空」替代「||」，并区分“缺值”与“0”，同时把非法输入
 * 转为可读的错误信息（由 ToolExecutor 统一捕获展示），而不是算出 NaN。
 */

/** 判断一个输入是否“未提供” */
export function isEmptyValue(value: unknown): boolean {
  return (
    value === '' ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * 把表单输入安全地转成 number。
 *
 * @param value    表单传入的值（可能是 '' / string / number）
 * @param fallback 可选。当值为“未提供”时返回的兜底值（用于可选字段）。
 *                 若未提供 fallback 且值缺失，则抛错（用于必填字段）。
 * @returns 数值
 * @throws 当值缺失且无 fallback，或值非法（NaN）时抛出可读错误。
 */
export function num(value: unknown, fallback?: number): number {
  if (isEmptyValue(value)) {
    if (fallback !== undefined) return fallback;
    throw new Error('必填数值未填写');
  }
  // 已是 number 直接返回；否则尝试转换
  const n = typeof value === 'number' ? value : Number(value);
  if (typeof n !== 'number' || Number.isNaN(n)) {
    throw new Error('请输入有效的数字');
  }
  return n;
}

/** 是否为有限数（排除 NaN / Infinity），用于结果兜底 */
export function isFiniteNumber(n: number): boolean {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * 安全除法：除数为 0 或非法时返回 null（调用方据此提示），避免 Infinity。
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator)) return null;
  if (denominator === 0) return null;
  return numerator / denominator;
}

/** 把数字四舍五入到指定小数位，避免浮点误差（如 0.1+0.2） */
export function roundTo(n: number, digits = 2): number {
  if (!isFiniteNumber(n)) return n;
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
}

/** 把可能是空值的文本转成字符串，空值返回 fallback */
export function str(value: unknown, fallback = ''): string {
  if (isEmptyValue(value)) return fallback;
  return String(value);
}
