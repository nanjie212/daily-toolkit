import { describe, it, expect } from 'vitest';
import { transformFancyText, isGlyphSupported } from '../funTools';
import { funTools } from '../../fun';

/**
 * 从 fun.ts 的工具定义里读取「装饰文字生成」的全部 style 选项，
 * 保证测试覆盖面随 UI 选项自动同步（新增风格会自动被这里遍历到）。
 */
function getAllStyles(): string[] {
  const tool = funTools.find((t) => t.id === 'fancy-text-generator');
  if (!tool) throw new Error('未找到 fancy-text-generator 工具定义');
  const field = tool.inputSchema?.find((f) => f.key === 'style');
  if (!field || !field.options) throw new Error('未找到 style 字段的 options 定义');
  const styles = field.options.map((o) => String(o.value));
  if (styles.length === 0) throw new Error('style options 为空');
  return styles;
}

const ALL_STYLES = getAllStyles();

/** 判断字符串是否含有 SMP（码位 > U+FFFF）字符——这类字符在 Windows 常见字体下会渲染成豆腐块。 */
function hasAstralChar(s: string): boolean {
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && cp >= 0x10000) return true;
  }
  return false;
}

describe('transformFancyText（装饰文字生成）', () => {
  it('fun.ts 的 style 选项 label 全部为 BMP 安全文本（不含豆腐块字符）', () => {
    const tool = funTools.find((t) => t.id === 'fancy-text-generator');
    const field = tool?.inputSchema?.find((f) => f.key === 'style');
    expect(field?.options).toBeDefined();
    for (const opt of field!.options!) {
      expect(hasAstralChar(String(opt.label))).toBe(false);
    }
  });

  it('断言1：英文输入 "Hello" 在每一种风格下的输出都不等于原文', () => {
    const input = 'Hello';
    for (const style of ALL_STYLES) {
      const { result } = transformFancyText(input, style);
      expect(result, `风格 ${style} 未产生任何变化`).not.toBe(input);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('断言2：中文输入 "今天天气真好" 在每一种风格下的输出都不等于原文', () => {
    const input = '今天天气真好';
    for (const style of ALL_STYLES) {
      const { result } = transformFancyText(input, style);
      expect(result, `风格 ${style} 对中文未产生任何变化`).not.toBe(input);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('断言3：glyphChecker 全部返回 false 时，任何风格的输出都不含 SMP 字符（降级不产生豆腐块）', () => {
    const inputs = ['Hello', '今天天气真好', 'Hello 今天 123'];
    for (const input of inputs) {
      for (const style of ALL_STYLES) {
        const { result } = transformFancyText(input, style, { glyphChecker: () => false });
        for (const ch of result) {
          const cp = ch.codePointAt(0)!;
          expect(
            cp,
            `风格 ${style} 对 "${input}" 降级后仍输出了 SMP 字符 U+${cp.toString(16).toUpperCase()}`,
          ).toBeLessThan(0x10000);
        }
      }
    }
  });

  it('断言4：无 canvas 环境（vitest 默认）下 isGlyphSupported 安全降级返回 true', () => {
    expect(isGlyphSupported('A')).toBe(true);
    expect(isGlyphSupported('🄰')).toBe(true);
    expect(isGlyphSupported('今')).toBe(true);
  });

  it('断言5：flip 风格对 "abc?" 反转字符顺序，且 "?" 被映射为 "¿"', () => {
    const { result } = transformFancyText('abc?', 'flip');
    // 翻转文字的语义是「整体倒过来读」：先反转字符序，再逐字符做上下颠倒映射。
    // 因此 "abc?" -> 反转 "?cba" -> 映射 "¿ɔqɐ"。
    // 注意：由于字符序被反转，末尾的 "?" 会出现在结果的开头（这是 flip 的正确行为）。
    expect(result).toBe('¿ɔqɐ');
    expect(result).toContain('¿');
    expect(result.startsWith('¿')).toBe(true);
    // 显式验证「字符顺序是反转的」：把结果反向映射回去应还原为原文顺序
    const backMap: Record<string, string> = { '¿': '?', 'ɔ': 'c', 'q': 'b', 'ɐ': 'a' };
    const restored = [...result].reverse().map((c) => backMap[c] ?? c).join('');
    expect(restored).toBe('abc?');
    // 且输出不含 SMP 字符
    expect(hasAstralChar(result)).toBe(false);
  });

  it('flip 风格在 glyphChecker 返回 false 时降级为纯反转，且不含 SMP 字符', () => {
    const { result, note } = transformFancyText('abc?', 'flip', { glyphChecker: () => false });
    expect(result).toBe('?cba');
    expect(note).not.toBe('');
    expect(hasAstralChar(result)).toBe(false);
  });

  it('未知风格回落到 bubbles，不抛异常', () => {
    const { result } = transformFancyText('abc', 'not-a-real-style');
    expect(result).toBe('ⓐⓑⓒ');
  });

  it('空字符串输入返回空字符串，不抛异常', () => {
    for (const style of ALL_STYLES) {
      const { result } = transformFancyText('', style);
      expect(result).toBe('');
    }
  });
});
