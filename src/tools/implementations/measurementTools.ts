import type { ToolOutput } from '@/types';

/** 解析结果：null 表示输入不是合法分数 / 数字 */
interface ParsedFraction {
  numerator: number;
  denominator: number;
}

/**
 * 解析 "3/4"、"-3/4"、"5" 这类输入。
 *
 * 注意：这里**不能**写成 `den || 1` —— 那样 '1/0' 会被静默改写成 '1/1'，
 * 分母为零的非法输入反而算出了一个看似正常的结果。分母为 0 或任一部分
 * 非数字时一律返回 null，由调用方给出明确报错。
 */
function parseFraction(raw: string): ParsedFraction | null {
  const s = raw.trim();
  if (!s) return null;

  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length !== 2) return null;
    const numerator = Number(parts[0].trim());
    const denominator = Number(parts[1].trim());
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
    if (denominator === 0) return null;
    return { numerator, denominator };
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return { numerator: n, denominator: 1 };
}

export async function fractionCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const fraction1 = (input.fraction1 as string) || '';
    const fraction2 = (input.fraction2 as string) || '';
    const op = (input.op as string) || 'add';
    if (!fraction1.trim()) return { success: false, error: '请输入分数' };

    const f1 = parseFraction(fraction1);
    if (!f1) return { success: false, error: `"${fraction1}" 不是有效分数（分母不能为零，格式如 3/4）` };

    let f2: ParsedFraction = { numerator: 0, denominator: 1 };
    if (op !== 'simplify') {
      if (!fraction2.trim()) return { success: false, error: '请输入第二个分数' };
      const parsed = parseFraction(fraction2);
      if (!parsed) return { success: false, error: `"${fraction2}" 不是有效分数（分母不能为零，格式如 3/4）` };
      f2 = parsed;
    }

    const n1 = f1.numerator;
    const d1 = f1.denominator;
    const n2 = f2.numerator;
    const d2 = f2.denominator;

    if (op === 'divide' && n2 === 0) {
      return { success: false, error: '除法运算中第二个分数的分子不能为零（相当于除零）' };
    }

    let num = 0;
    let den = 1;
    if (op === 'add') { num = n1 * d2 + n2 * d1; den = d1 * d2; }
    else if (op === 'subtract') { num = n1 * d2 - n2 * d1; den = d1 * d2; }
    else if (op === 'multiply') { num = n1 * n2; den = d1 * d2; }
    else if (op === 'divide') { num = n1 * d2; den = d1 * n2; }
    else if (op === 'simplify') { num = n1; den = d1; }
    else return { success: false, error: `不支持的运算类型: ${op}` };

    // 兜底：正常路径下 den 不可能为 0（各分母已校验非零），此处防御异常运算类型
    if (den === 0) return { success: false, error: '分母不能为零' };

    const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
    const g = gcd(num, den) || 1;
    num /= g;
    den /= g;
    if (den < 0) { num = -num; den = -den; }

    const decimalVal = num / den;
    const opNames: Record<string, string> = { add: '加法', subtract: '减法', multiply: '乘法', divide: '除法', simplify: '约分' };
    return {
      success: true,
      data: {
        运算: opNames[op] || op,
        分数1: `${n1}/${d1}`,
        分数2: op !== 'simplify' ? `${n2}/${d2}` : '-',
        结果: den === 1 ? `${num}` : `${num}/${den}`,
        小数: decimalVal.toFixed(4),
        提示: '分数会自动化简到最简形式',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}
