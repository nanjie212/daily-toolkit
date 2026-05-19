import type { ToolOutput } from '@/types';

export async function onlineRuler(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const dpi = Number(input.dpi) || 96;
    const unit = (input.unit as string) || 'cm';
    const cmPerInch = 2.54;
    const pixelsPerCm = dpi / cmPerInch;
    const pixelsPerInch = dpi;
    return {
      success: true,
      data: {
        屏幕DPI: `${dpi} (默认96，可调)`,
        每厘米像素: `${pixelsPerCm.toFixed(1)} px/cm`,
        每英寸像素: `${pixelsPerInch} ppi`,
        使用方法: unit === 'cm'
          ? `在屏幕上放置一个你知道尺寸的物体做参照，\n每${pixelsPerCm.toFixed(0)}像素≈1厘米`
          : '在屏幕上放置一个你知道尺寸的物体做参照',
        提示: '在线尺子受屏幕DPI影响，建议先用实物校准DPI值',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function screenInfo(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const width = window.screen.width;
    const height = window.screen.height;
    const availWidth = window.screen.availWidth;
    const availHeight = window.screen.availHeight;
    const colorDepth = window.screen.colorDepth;
    const pixelRatio = window.devicePixelRatio;
    const language = navigator.language;
    const platform = navigator.platform;
    const aspectRatio = (width / height).toFixed(2);
    return {
      success: true,
      data: {
        屏幕分辨率: `${width} x ${height}`,
        可用区域: `${availWidth} x ${availHeight}`,
        设备像素比: `@${pixelRatio}x`,
        色深: `${colorDepth} 位`,
        宽高比: aspectRatio,
        操作系统: platform || '未知',
        浏览器语言: language,
        提示: '信息仅供参考，不含任何隐私数据',
      },
    };
  } catch (e) { return { success: false, error: `检测失败: ${(e as Error).message}` }; }
}

export async function randomNumberGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const min = Number(input.min) || 1;
    const max = Number(input.max) || 100;
    const count = Number(input.count) || 5;
    const allowRepeat = (input.allowRepeat as boolean) ?? false;
    if (min >= max) return { success: false, error: '最小值必须小于最大值' };
    if (!allowRepeat && (max - min + 1) < count) return { success: false, error: `区间内只有${max - min + 1}个整数，无法生成${count}个不重复的数` };
    const numbers: number[] = [];
    if (allowRepeat) {
      for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
    } else {
      const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        numbers.push(pool[idx]);
        pool.splice(idx, 1);
      }
    }
    return {
      success: true,
      data: {
        随机范围: `${min} ~ ${max}`,
        生成结果: numbers.join(', '),
        数量: `${count} 个`,
        允许重复: allowRepeat ? '是' : '否',
        提示: '每次执行都会重新生成，点击执行即可刷新',
      },
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

export async function numberBaseConverter(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const num = (input.num as string) || '';
    const fromBase = Number(input.fromBase) || 10;
    const toBase = Number(input.toBase) || 2;
    if (!num || isNaN(parseInt(num, fromBase))) return { success: false, error: '请输入有效数字' };
    const decimal = parseInt(num, fromBase);
    if (isNaN(decimal)) return { success: false, error: '输入数字与进制不匹配' };
    const targetStr = decimal.toString(toBase).toUpperCase();
    return {
      success: true,
      data: {
        原始值: `${num} (${fromBase}进制)`,
        十进制: `${decimal}`,
        二进制: decimal.toString(2),
        八进制: decimal.toString(8),
        十六进制: decimal.toString(16).toUpperCase(),
        [`${toBase}进制结果`]: targetStr,
        提示: '同时显示多种进制便于对照参考',
      },
    };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

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