/**
 * 懒加载回归测试（QA 第二轮验证）。
 *
 * 背景：opencc-js（约 1.1MB 词典）与 pdfjs worker（约 1MB）由静态 import
 * 改为按需动态 import：
 *   - documentTools.traditionalSimplified 内部通过模块级缓存 loadOpenCC() 加载；
 *   - pdfTools.pdfToWord 内部动态 import pdfjs-dist 与 worker URL。
 * 本文件验证：
 *   1. 动态 import 路径功能正确（转换结果与静态 import 时代一致）；
 *   2. 第一次调用与第二次调用（缓存命中）结果一致；
 *   3. 输入校验在 await 动态加载之前短路，缺输入时不触发重库加载也能优雅报错。
 */
import { describe, it, expect } from 'vitest';
import { traditionalSimplified } from '@/tools/implementations/documentTools';
import { pdfToWord, pdfSplit } from '@/tools/implementations/pdfTools';

describe('traditionalSimplified - opencc 动态加载', () => {
  // 注意：opencc-js 的 tw/cn 转换为字符级（TWPhrases 词汇表未内置），
  // 「軟體」按字符映射为「软体」而非大陆词汇「软件」——此为库既有行为，
  // 与静态 import 时代一致，非本次懒加载改动引入。
  it('t2s：繁体转简体结果正确', async () => {
    const r = await traditionalSimplified({ text: '臺灣軟體發展', mode: 't2s' });
    expect(r.success).toBe(true);
    expect(r.data).toBe('台湾软体发展');
  });

  it('s2t：简体转繁体结果正确', async () => {
    const r = await traditionalSimplified({ text: '台湾软件发展', mode: 's2t' });
    expect(r.success).toBe(true);
    expect(r.data).toBe('臺灣軟件發展');
  });

  it('第二次调用（缓存命中）与第一次结果一致', async () => {
    const first = await traditionalSimplified({ text: '頭髮裏面', mode: 't2s' });
    const second = await traditionalSimplified({ text: '頭髮裏面', mode: 't2s' });
    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    // 「頭髮」→「头发」而非「头发展」，验证词典真实加载
    expect(second.data).toBe('头发里面');
    expect(second.data).toBe(first.data);
  });

  it('缺 mode 时默认 t2s', async () => {
    const r = await traditionalSimplified({ text: '繁體字' });
    expect(r.success).toBe(true);
    expect(r.data).toBe('繁体字');
  });

  it('空文本在动态加载前短路报错', async () => {
    const r = await traditionalSimplified({ text: '', mode: 't2s' });
    expect(r.success).toBe(false);
    expect(r.error).toContain('请输入文本内容');
  });
});

describe('pdfTools - 动态 worker 加载的防御路径', () => {
  it('pdfToWord 缺文件时优雅报错（不触发 pdfjs 加载即返回）', async () => {
    const r = await pdfToWord({});
    expect(r.success).toBe(false);
    expect(r.error).toContain('请选择PDF文件');
  });

  it('pdfSplit 缺文件时优雅报错', async () => {
    const r = await pdfSplit({});
    expect(r.success).toBe(false);
    expect(String(r.error)).toBeTruthy();
  });

  it('pdfToWord 传入非 PDF 数据时捕获异常而非抛崩', async () => {
    // pdfjs 动态加载在 node 环境下若不可用，也应被 try/catch 收敛为 success:false
    const fakeFile = new File([new Uint8Array([1, 2, 3, 4])], 'bad.pdf', {
      type: 'application/pdf',
    });
    const r = await pdfToWord({ file: fakeFile });
    expect(r.success).toBe(false);
    expect(String(r.error)).toBeTruthy();
  });
});
