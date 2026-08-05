import { describe, it, expect } from 'vitest';
import { extractWordFrequencies } from '../magicTools';

describe('extractWordFrequencies（词云分词 + 词频统计）', () => {
  it('重复中文词能被正确计数，最高频词为「苹果」且次数正确', () => {
    const result = extractWordFrequencies('苹果 香蕉 苹果 苹果 香蕉 橘子');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].word).toBe('苹果');
    expect(result[0].count).toBe(3);
    // 词频降序
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
  });

  it('中文停用词（如「的」）不出现在结果中', () => {
    const result = extractWordFrequencies('我的苹果 你的香蕉 的的的 的');
    const words = result.map((r) => r.word);
    expect(words).not.toContain('的');
    expect(words).toContain('苹果');
    expect(words).toContain('香蕉');
  });

  it('长句不会被当成单个词（主 Bug 回归测试）', () => {
    const text = '今天天气很好我们去公园玩';
    const result = extractWordFrequencies(text);
    const words = result.map((r) => r.word);
    // 整句不应作为单个 token 出现
    expect(words).not.toContain(text);
    // 应拆出多个有意义的词
    expect(result.length).toBeGreaterThan(1);
    // 单字中文应被过滤
    for (const w of words) {
      expect(w.length).toBeGreaterThan(1);
    }
  });

  it('英文停用词被过滤，实质英文词保留', () => {
    const result = extractWordFrequencies('the cat and the dog is running');
    const words = result.map((r) => r.word);
    expect(words).not.toContain('the');
    expect(words).not.toContain('and');
    expect(words).not.toContain('is');
    expect(words).toContain('cat');
    expect(words).toContain('dog');
  });

  it('空输入返回空数组', () => {
    expect(extractWordFrequencies('')).toEqual([]);
    expect(extractWordFrequencies('   ')).toEqual([]);
  });

  it('仅输入停用词时结果为空（触发友好提示分支）', () => {
    expect(extractWordFrequencies('的了是')).toEqual([]);
  });

  it('英文短词（ai/3d）应保留，停用词 and 被过滤', () => {
    const result = extractWordFrequencies('AI and 3D and AI');
    const words = result.map((r) => r.word);
    expect(words).toContain('ai');
    expect(words).toContain('3d');
    expect(words).not.toContain('and');
    const ai = result.find((r) => r.word === 'ai');
    expect(ai?.count).toBe(2);
  });

  it('两字母有效英文词 AI / UI 不被长度过滤误杀', () => {
    const result = extractWordFrequencies(
      'AI is changing UI design. AI tools and UI patterns are everywhere.',
    );
    const words = result.map((r) => r.word);
    expect(words).toContain('ai');
    expect(words).toContain('ui');
    expect(words).not.toContain('is');
    expect(words).not.toContain('and');
    expect(words).not.toContain('are');
  });
});
