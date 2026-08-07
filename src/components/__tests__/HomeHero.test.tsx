import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';
import HomeHero from '@/components/HomeHero';
import { COMMON_TOOL_IDS, COMMON_TOOLS_MOBILE_LIMIT } from '@/tools/commonTools';
import { builtInTools } from '@/tools';

/** 产品明令禁止出现在首屏与工具文案里的 SaaS/AI 营销腔词汇。 */
const BANNED_WORDS = ['赋能', '全能', '强大', '高效生产力', '一站式', '智能平台', '提升效率'];

/**
 * 首屏英雄区回归测试。
 *
 * 主要守住三件事：
 * 1. 首屏三句文案一字不差（产品要求，禁止被"优化"掉）
 * 2. 首屏 DOM 里不出现营销腔禁用词
 * 3. COMMON_TOOL_IDS 里的 id 都真实存在，避免精选工具静默消失
 */
function renderHero(query = ''): string {
  const inputRef = createRef<HTMLInputElement>();
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(HomeHero, {
        tools: builtInTools,
        searchQuery: query,
        onSearchChange: () => {},
        searchInputRef: inputRef,
      }),
    ),
  );
}

describe('HomeHero', () => {
  it('COMMON_TOOL_IDS 中的每个 id 都能在已注册工具中找到', () => {
    const missing = COMMON_TOOL_IDS.filter((id) => !builtInTools.some((tool) => tool.id === id));
    expect(missing).toEqual([]);
  });

  it('COMMON_TOOL_IDS 无重复', () => {
    expect(new Set(COMMON_TOOL_IDS).size).toBe(COMMON_TOOL_IDS.length);
  });

  it('渲染出指定的主标题、副标题与中央搜索框', () => {
    const html = renderHero();
    expect(html).toContain('一个网页，解决你的日常小问题');
    expect(html).toContain('无需安装，打开即用的在线实用工具集合');
    expect(html).toContain('搜索工具，比如 二维码、房贷、图片压缩');
    expect(html).toContain('Ctrl K');
  });

  it('常用工具全部渲染，且移动端只默认展示前 N 个', () => {
    const html = renderHero();
    for (const id of COMMON_TOOL_IDS) {
      const tool = builtInTools.find((t) => t.id === id);
      expect(tool, `工具 ${id} 不存在`).toBeTruthy();
      expect(html).toContain(tool!.name);
    }
    const hiddenOnMobile = (html.match(/hidden sm:inline-flex/g) || []).length;
    expect(hiddenOnMobile).toBe(
      Math.max(0, COMMON_TOOL_IDS.length - COMMON_TOOLS_MOBILE_LIMIT),
    );
  });

  it('首屏不出现营销腔禁用词', () => {
    const html = renderHero();
    for (const word of BANNED_WORDS) {
      expect(html, `首屏不应出现「${word}」`).not.toContain(word);
    }
  });

  it('所有工具的名称与描述都不含营销腔禁用词', () => {
    // 搜索下拉会直接展示 tool.name / tool.description，
    // 所以整个工具表都必须保持克制的调性——新增工具带营销腔会在这里被拦下。
    const offenders: string[] = [];
    for (const tool of builtInTools) {
      const text = `${tool.name} ${tool.description}`;
      for (const word of BANNED_WORDS) {
        if (text.includes(word)) {
          offenders.push(`${tool.id}: 「${word}」 出现在 "${text}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
