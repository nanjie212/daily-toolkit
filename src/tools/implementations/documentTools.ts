import * as OpenCC from 'opencc-js';
import type { ToolOutput } from '@/types';

export async function textCounter(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;

    if (!text) return { success: false, error: '请输入文本内容' };

    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const sentences = (text.match(/[.!?。！？]+/g) || []).length;

    return {
      success: true,
      data: {
        总字符数: chars,
        不含空格字符数: charsNoSpaces,
        单词数: words,
        中文字符数: chineseChars,
        行数: lines,
        段落数: paragraphs,
        句子数: sentences,
      },
    };
  } catch (e) {
    return { success: false, error: `统计失败: ${(e as Error).message}` };
  }
}

export async function traditionalSimplified(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 't2s';

    if (!text) return { success: false, error: '请输入文本内容' };

    let result: string;
    if (mode === 't2s') {
      const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
      result = converter(text);
    } else {
      const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });
      result = converter(text);
    }

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: `转换失败: ${(e as Error).message}` };
  }
}

export async function caseConverter(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'upper';

    if (!text) return { success: false, error: '请输入文本内容' };

    let result: string;
    switch (mode) {
      case 'upper':
        result = text.toUpperCase();
        break;
      case 'lower':
        result = text.toLowerCase();
        break;
      case 'capitalize':
        result = text.replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      case 'sentence':
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
        break;
      case 'alternating':
        result = text
          .split('')
          .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
          .join('');
        break;
      default:
        result = text;
    }

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: `转换失败: ${(e as Error).message}` };
  }
}

export async function textDedup(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'exact';

    if (!text) return { success: false, error: '请输入文本内容' };

    const lines = text.split('\n');
    const originalCount = lines.length;
    let result: string;

    switch (mode) {
      case 'exact': {
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const line of lines) {
          if (!seen.has(line)) {
            seen.add(line);
            unique.push(line);
          }
        }
        result = unique.join('\n');
        break;
      }
      case 'blank': {
        const filtered = lines.filter((line) => line.trim() !== '');
        result = filtered.join('\n');
        break;
      }
      case 'sort': {
        const unique = [...new Set(lines)];
        unique.sort();
        result = unique.join('\n');
        break;
      }
      default:
        result = text;
    }

    const resultLines = result.split('\n');
    const removedCount = originalCount - resultLines.length;

    return {
      success: true,
      data: `${result}\n\n--- 去重统计 ---\n原始行数: ${originalCount}\n去重后行数: ${resultLines.length}\n移除行数: ${removedCount}`,
    };
  } catch (e) {
    return { success: false, error: `去重失败: ${(e as Error).message}` };
  }
}
