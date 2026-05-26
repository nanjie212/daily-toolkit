import type { ToolOutput } from '@/types';

export async function fractionCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const fraction1 = (input.fraction1 as string) || '';
    const fraction2 = (input.fraction2 as string) || '';
    const op = (input.op as string) || 'add';
    if (!fraction1) return { success: false, error: '请输入分数' };
    const parseFraction = (s: string): [number, number] => {
      if (s.includes('/')) {
        const [num, den] = s.split('/').map(n => Number(n.trim()));
        return [num, den || 1];
      }
      return [Number(s), 1];
    };
    const [n1, d1] = parseFraction(fraction1);
    const [n2, d2] = op !== 'simplify' ? parseFraction(fraction2) : [0, 1];
    if (d1 === 0 || d2 === 0) return { success: false, error: '分母不能为零' };
    let num = 0, den = 1;
    if (op === 'add') { num = n1 * d2 + n2 * d1; den = d1 * d2; }
    else if (op === 'subtract') { num = n1 * d2 - n2 * d1; den = d1 * d2; }
    else if (op === 'multiply') { num = n1 * n2; den = d1 * d2; }
    else if (op === 'divide') { num = n1 * d2; den = d1 * n2; }
    else if (op === 'simplify') { num = n1; den = d1; }
    const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
    const g = gcd(num, den);
    num /= g; den /= g;
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