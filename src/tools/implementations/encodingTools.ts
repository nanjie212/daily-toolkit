import type { ToolOutput } from '@/types';

export async function base64Encode(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'encode';
    if (!text) return { success: false, error: '请输入文本' };
    if (mode === 'encode') {
      const encoded = btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
      return { success: true, data: { 原文: text, Base64结果: encoded, 提示: 'Base64编码不是加密，可被直接解码' } };
    } else {
      const decoded = decodeURIComponent(atob(text).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return { success: true, data: { Base64原文: text, 解码结果: decoded, 提示: '解码结果已自动还原UTF-8编码' } };
    }
  } catch (e) { return { success: false, error: `操作失败: ${(e as Error).message}` }; }
}