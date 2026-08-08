/**
 * OrbitItem SSR 级回归测试（docs/orbit-v2-visual-spec.md §7 T03）。
 *
 * 环境：vitest `environment: 'node'`——用 renderToStaticMarkup 静态渲染，
 * 不依赖 jsdom / ResizeObserver。
 *
 * 覆盖：
 * 1. 静态渲染不抛错，三层 DOM 结构保留（.orbit-item → .orbit-item__float → .orbit-chip）；
 * 2. chip class 含分类色 class `orbit-chip--cat-{id}`（v2 分类填色）；
 * 3. state=matched → chip 同时含 `orbit-chip--matched`（高亮 ring/光晕由 CSS 承担）；
 * 4. 不同分类渲染出不同分类 class。
 */

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrbitItem } from '@/components/orbit/OrbitItem';
import type { ToolRecord } from '@/types';
import type { OrbitNode, OrbitTransform } from '@/lib/orbit/types';

function makeTool(overrides: Partial<ToolRecord> = {}): ToolRecord {
  return {
    id: 'calc',
    name: '计算器',
    description: '日常计算工具',
    category: 'finance',
    icon: 'CalculatorIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [],
    outputFormat: 'text',
    ...overrides,
  };
}

function makeNode(toolId: string): OrbitNode {
  return {
    toolId,
    categoryId: 'finance',
    ringIndex: 0,
    indexInRing: 0,
    theta: 0,
    bx: 0,
    by: 0,
  };
}

function idleTransform(): OrbitTransform {
  return { dx: 0, dy: 0, scale: 1, opacity: 1, z: 1, state: 'idle' };
}

function render(
  tool: ToolRecord,
  transform: OrbitTransform,
  node?: OrbitNode,
): string {
  return renderToStaticMarkup(
    createElement(OrbitItem, {
      node: node ?? makeNode(tool.id),
      tool,
      transform,
      itemW: 76,
      itemH: 62,
      enterIndex: 0,
      onActivate: () => {},
    }),
  );
}

describe('OrbitItem (SSR)', () => {
  it('静态渲染不抛错，三层 DOM 结构保留', () => {
    const html = render(makeTool(), idleTransform());
    expect(html).toContain('class="orbit-item');
    expect(html).toContain('orbit-item__float');
    expect(html).toContain('orbit-chip');
    expect(html).toContain('计算器');
  });

  it('chip class 含分类色 class orbit-chip--cat-{id}', () => {
    const html = render(makeTool({ category: 'finance' }), idleTransform());
    expect(html).toContain('orbit-chip--cat-finance');
  });

  it('不同分类渲染出不同分类 class', () => {
    const html = render(makeTool({ category: 'fun', id: 'fun-tool' }), idleTransform());
    expect(html).toContain('orbit-chip--cat-fun');
    expect(html).not.toContain('orbit-chip--cat-finance');
  });

  it('state=matched → chip 同时含 orbit-chip--matched（静态 ring/光晕由 CSS 承担）', () => {
    const html = render(
      makeTool(),
      { dx: 0, dy: 0, scale: 1.18, opacity: 1, z: 6, state: 'matched' },
    );
    expect(html).toContain('orbit-chip--matched');
    expect(html).toContain('orbit-chip--cat-finance');
  });

  it('state=dimmed → chip 含 orbit-chip--dimmed 且不误带 matched', () => {
    const html = render(
      makeTool(),
      { dx: 4, dy: 4, scale: 0.94, opacity: 0.32, z: 2, state: 'dimmed' },
    );
    expect(html).toContain('orbit-chip--dimmed');
    expect(html).not.toContain('orbit-chip--matched');
  });
});
