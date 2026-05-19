import type { ToolOutput } from '@/types';

export async function base64Encode(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'encode';
    if (!text) return { success: false, error: '请输入文本' };
    if (mode === 'encode') {
      const encoded = btoa(unescape(encodeURIComponent(text)));
      return { success: true, data: { 原文: text, Base64结果: encoded, 提示: 'Base64编码不是加密，可被直接解码' } };
    } else {
      const decoded = decodeURIComponent(escape(atob(text)));
      return { success: true, data: { Base64原文: text, 解码结果: decoded, 提示: '解码结果已自动还原UTF-8编码' } };
    }
  } catch (e) { return { success: false, error: `操作失败: ${(e as Error).message}` }; }
}

export async function urlEncode(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'encode';
    if (!text) return { success: false, error: '请输入文本' };
    if (mode === 'encode') return { success: true, data: { 原文: text, URL编码结果: encodeURIComponent(text), 提示: 'URL编码用于在网址中安全传输特殊字符' } };
    return { success: true, data: { URL编码原文: text, 解码结果: decodeURIComponent(text), 提示: '将%XX格式的URL编码还原为原始文本' } };
  } catch (e) { return { success: false, error: `操作失败: ${(e as Error).message}` }; }
}

export async function hashGenerate(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const algo = (input.algo as string) || 'MD5';
    if (!text) return { success: false, error: '请输入文本' };
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { success: true, data: { 原文: text, 算法: algo, 哈希值: hashHex, 提示: '哈希为单向计算，无法从哈希值还原原文' } };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

export async function unicodeConvert(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'charToUnicode';
    if (!text) return { success: false, error: '请输入文本' };
    if (mode === 'charToUnicode') {
      const codes = Array.from(text).map(c => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
      return { success: true, data: { 原文: text, Unicode码点: codes, 提示: '每个字符对应的Unicode码位' } };
    } else if (mode === 'unicodeToChar') {
      const parts = text.split(/\s+/);
      const chars = parts.map(p => {
        const hex = p.replace(/^U\+/i, '');
        return String.fromCodePoint(parseInt(hex, 16));
      }).join('');
      return { success: true, data: { Unicode输入: text, 字符结果: chars, 提示: '将Unicode码点还原为字符' } };
    }
    return { success: false, error: '未知转换模式' };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

export async function morseConvert(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'encode';
    if (!text) return { success: false, error: '请输入文本' };
    const morseMap: Record<string, string> = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
      'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
      'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
      ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
    };
    const reverseMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(morseMap)) reverseMap[v] = k;
    if (mode === 'encode') {
      const result = text.toUpperCase().split('').map(c => morseMap[c] || c).join(' ');
      return { success: true, data: { 原文: text, 摩斯密码: result, 提示: '字母间用空格分隔，单词间用/分隔' } };
    }
    const result = text.split(' ').map(code => reverseMap[code] || code).join('');
    return { success: true, data: { 摩斯密码: text, 解码结果: result, 提示: '摩斯密码用 . (点) 和 - (划) 表示' } };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}