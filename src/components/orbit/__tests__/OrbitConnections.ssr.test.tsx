/**
 * OrbitConnections SSR 级回归测试（docs/orbit-v2-visual-spec.md §7 T02）。
 *
 * 环境：vitest `environment: 'node'`——用 renderToStaticMarkup 静态渲染 SVG，
 * 不依赖 jsdom / ResizeObserver。
 *
 * 覆盖：
 * 1. 静态渲染不抛错，line 数量正确（3 节点同环 → 3 条）；
 * 2. viewBox 以舞台中心为原点（`-w/2 -h/2 w h`，bx/by 零转换）；
 * 3. transforms 带 dx:10 → 端点 x = bx + 10（跟随排斥位移不断线）；
 * 4. 命中任一端点 → 该 line 含 orbit-line--active；
 * 5. 每线 class 含 orbit-line--cat-{发送方分类}。
 */

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OrbitConnections from '@/components/orbit/OrbitConnections';
import type { OrbitNode, OrbitTransform, StageBox } from '@/lib/orbit/types';

const stage: StageBox = { width: 800, height: 600 };

/** 3 节点同环：a/b 同 everyday，c 为 finance（跨段段会被跳过） */
const nodes: OrbitNode[] = [
  { toolId: 'a', categoryId: 'everyday', ringIndex: 0, indexInRing: 0, theta: 0, bx: 100, by: 0 },
  { toolId: 'b', categoryId: 'everyday', ringIndex: 0, indexInRing: 1, theta: 1, bx: -50, by: 86 },
  { toolId: 'c', categoryId: 'finance', ringIndex: 0, indexInRing: 2, theta: 2, bx: -100, by: -86 },
];

function idle(toolId: string, overrides: Partial<OrbitTransform> = {}): OrbitTransform {
  return {
    dx: 0,
    dy: 0,
    scale: 1,
    opacity: 1,
    z: 1,
    state: 'idle',
    ...overrides,
  };
}

function render(
  transforms: Record<string, OrbitTransform>,
  overrides: { nodes?: readonly OrbitNode[]; stage?: StageBox } = {},
): string {
  return renderToStaticMarkup(
    createElement(OrbitConnections, {
      nodes: overrides.nodes ?? nodes,
      transforms,
      stage: overrides.stage ?? stage,
    }),
  );
}

function countLines(html: string): number {
  return (html.match(/<line /g) ?? []).length;
}

describe('OrbitConnections (SSR)', () => {
  it('静态渲染不抛错，line 数量 = 同分类闭环边数（a→b 与 b→a… 跨段跳过）', () => {
    const html = render({ a: idle('a'), b: idle('b'), c: idle('c') });
    expect(html).toContain('<svg');
    expect(html).toContain('class="orbit-lines"');
    // a→b 同分类保留；b→c 跨分类跳过；c→a 跨分类跳过 → 1 条
    expect(countLines(html)).toBe(1);
  });

  it('viewBox 以舞台中心为原点（-w/2 -h/2 w h）', () => {
    const html = render({ a: idle('a'), b: idle('b'), c: idle('c') });
    expect(html).toContain('viewBox="-400 -300 800 600"');
  });

  it('transform 带 dx:10 → 端点 x = bx + 10（跟随排斥位移不断线）', () => {
    // a 被推开 dx=10：a→b 边的 x1 应从 100 → 110
    const html = render({
      a: idle('a', { dx: 10, dy: 0, state: 'pushed' }),
      b: idle('b'),
      c: idle('c'),
    });
    expect(html).toContain('x1="110"');
    expect(html).toContain('y1="0"');
  });

  it('命中任一端点 → 该 line 含 orbit-line--active', () => {
    const html = render({
      a: idle('a', { scale: 1.18, z: 6, state: 'matched' }),
      b: idle('b'),
      c: idle('c'),
    });
    expect(html).toContain('orbit-line--active');
  });

  it('每线 class 含 orbit-line--cat-{发送方分类}', () => {
    const html = render({ a: idle('a'), b: idle('b'), c: idle('c') });
    // 唯一保留边 a→b 的发送方是 everyday
    expect(html).toContain('orbit-line--cat-everyday');
    expect(html).not.toContain('orbit-line--cat-finance');
  });

  it('transforms 缺项时安全降级为静态端点（不抛错、不出现 NaN）', () => {
    const html = render({ a: idle('a') }); // b/c 的 transform 缺失
    expect(html).not.toContain('NaN');
    expect(countLines(html)).toBe(1);
  });

  it('空节点 → 空 SVG 不抛错', () => {
    const html = render({}, { nodes: [] });
    expect(html).toContain('<svg');
    expect(countLines(html)).toBe(0);
  });
});
