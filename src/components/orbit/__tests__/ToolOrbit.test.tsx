/**
 * ToolOrbit SSR 级回归测试。
 *
 * 环境：vitest `environment: 'node'`——用 renderToStaticMarkup 静态渲染，
 * 不依赖 jsdom、不依赖 ResizeObserver（SSR 下 useStageMetrics 返回 ready=false，
 * 因此断言的是「结构存在 + 无运行时错误」，不锁真实布局数值）。
 *
 * 覆盖：
 * 1. 静态渲染不抛异常，舞台结构（role/aria）存在；
 * 2. 中心搜索框（复用 CommandSearch）的 placeholder 与 Ctrl+K 提示存在；
 * 3. 不出现营销腔禁用词；
 * 4. z 轴不触碰 30/40/50（轨道预算硬上限 20）。
 */

import { describe, it, expect } from 'vitest';
import { createElement, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ToolOrbit from '@/components/orbit/ToolOrbit';
import { builtInTools } from '@/tools';

/** 产品明令禁止出现在首屏与工具文案里的 SaaS/AI 营销腔词汇。 */
const BANNED_WORDS = ['赋能', '全能', '强大', '高效生产力', '一站式', '智能平台', '提升效率'];

function renderOrbit(query = ''): string {
  const inputRef = createRef<HTMLInputElement>();
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(ToolOrbit, {
        tools: builtInTools,
        searchQuery: query,
        onSearchChange: () => {},
        searchInputRef: inputRef,
      }),
    ),
  );
}

describe('ToolOrbit (SSR)', () => {
  it('静态渲染不抛异常，舞台结构存在（role/aria/跳过锚点）', () => {
    const html = renderOrbit();
    expect(html).toContain('role="list"');
    expect(html).toContain('aria-label="工具环绕视图"');
    expect(html).toContain('跳到工具列表');
  });

  it('中心搜索框保留 CommandSearch 的 placeholder 与 Ctrl+K 提示', () => {
    const html = renderOrbit();
    expect(html).toContain('搜索工具，比如 二维码、房贷、图片压缩');
    expect(html).toContain('Ctrl K');
  });

  it('不出现营销腔禁用词', () => {
    const html = renderOrbit();
    for (const word of BANNED_WORDS) {
      expect(html, `不应出现「${word}」`).not.toContain(word);
    }
  });

  it('z 轴不触碰 30/40/50（轨道预算硬上限 20）', () => {
    const html = renderOrbit('压缩');
    expect(html).not.toContain('z-30');
    expect(html).not.toContain('z-40');
    expect(html).not.toContain('z-50');
  });

  it('有搜索词时仍能安全渲染（高亮链路在 SSR 下不抛错）', () => {
    const html = renderOrbit('压缩');
    expect(html).toContain('role="list"');
    expect(html).not.toContain('NaN');
  });
});
