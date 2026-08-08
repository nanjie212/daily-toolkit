// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import React, { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useOrbitHighlight } from '@/hooks/useOrbitHighlight';
import { ORBIT_Z, REPULSION_DEFAULT } from '@/lib/orbit/orbitConstants';
import type { OrbitHighlightResult, OrbitLayout, OrbitNode } from '@/lib/orbit/types';
import type { ToolRecord } from '@/types';

/**
 * useOrbitHighlight 匹配口径回归测试（QA M6 变异缺口）。
 *
 * 守卫点：环上高亮的匹配规则必须与 CommandSearch / Home 逐字一致——
 *   `matchPinyin(`${tool.name} ${tool.description} ${tool.id}`, query.trim())`
 * 即：大小写不敏感、可命中拼音、description 与 id 都参与匹配、首尾空格被 trim。
 * 任何一处口径被改（例如只搜 name），这里的断言会立刻变红。
 *
 * 另覆盖 reducedMotion 联动：系统开启「减少动态效果」时排斥位移归零、
 * 但匹配项的高亮放大态与未匹配项的变暗态必须保留（QA M5 联动断言）。
 *
 * 环境：jsdom（node 环境跑不了 hook）；无 @testing-library/react，沿用
 * useFocusTrap.test.tsx 的 createRoot + act 真实挂载写法。
 */

/** 构造一个只关心匹配的最小 ToolRecord（复用内置工具的 id / name / description）。 */
function tool(id: string, name: string, description: string): ToolRecord {
  return {
    id,
    name,
    description,
    category: 'everyday',
    icon: 'SparklesIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [],
    outputFormat: 'text',
  };
}

const TOOLS: ToolRecord[] = [
  tool('qrcode-generator', '二维码生成', '将文本或链接生成二维码图片'),
  tool('mortgage-calculator', '房贷计算器', '计算房贷月供、总利息和还款计划'),
  tool('simple-calculator', '简易计算器', '日常计算器，支持加减乘除和括号运算'),
];

/** 匹配口径不依赖布局，空 nodes 即可（只有 transforms 计算会用到 nodes）。 */
const EMPTY_LAYOUT = {
  config: { breakpoint: 'lg' },
  nodes: [],
} as unknown as OrbitLayout;

interface HighlightHarnessProps {
  tools: readonly ToolRecord[];
  layout: OrbitLayout;
  query: string;
  reducedMotion: boolean;
  onResult: (r: OrbitHighlightResult) => void;
}

function HighlightHarness({ tools, layout, query, reducedMotion, onResult }: HighlightHarnessProps) {
  const result = useOrbitHighlight(tools, layout, query, reducedMotion);
  useEffect(() => {
    onResult(result);
  });
  return null;
}

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = false;
});

function mount(props: Omit<HighlightHarnessProps, 'onResult'>): OrbitHighlightResult {
  let captured: OrbitHighlightResult | undefined;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<HighlightHarness {...props} onResult={(r) => { captured = r; }} />);
  });
  if (!captured) throw new Error('hook 未输出结果');
  return captured;
}

function unmount(): void {
  act(() => root.unmount());
  container.remove();
}

afterEach(() => {
  if (root) unmount();
});

describe('useOrbitHighlight · 匹配口径（M6 守卫）', () => {
  it('输入 name 命中对应工具', () => {
    const r = mount({ tools: TOOLS, layout: EMPTY_LAYOUT, query: '二维码', reducedMotion: false });
    expect(r.highlightIds.has('qrcode-generator')).toBe(true);
    expect(r.matchCount).toBe(1);
    expect(r.isSearching).toBe(true);
  });

  it('输入拼音命中（大小写不敏感：ERWEIMA == erweima）', () => {
    const r = mount({ tools: TOOLS, layout: EMPTY_LAYOUT, query: 'ERWEIMA', reducedMotion: false });
    expect(r.highlightIds.has('qrcode-generator')).toBe(true);
    expect(r.matchCount).toBe(1);
  });

  it('输入 description 里的词命中', () => {
    const r = mount({ tools: TOOLS, layout: EMPTY_LAYOUT, query: '月供', reducedMotion: false });
    expect(r.highlightIds.has('mortgage-calculator')).toBe(true);
    expect(r.matchCount).toBe(1);
  });

  it('输入 id 也参与匹配', () => {
    const r = mount({ tools: TOOLS, layout: EMPTY_LAYOUT, query: 'mortgage', reducedMotion: false });
    expect(r.highlightIds.has('mortgage-calculator')).toBe(true);
    expect(r.matchCount).toBe(1);
  });

  it('空 query 时 highlightIds 为空、isSearching=false', () => {
    const r = mount({ tools: TOOLS, layout: EMPTY_LAYOUT, query: '', reducedMotion: false });
    expect(r.highlightIds.size).toBe(0);
    expect(r.matchCount).toBe(0);
    expect(r.isSearching).toBe(false);
  });

  it('query 首尾空格被 trim（等价性）', () => {
    const trimmed = mount({ tools: TOOLS, layout: EMPTY_LAYOUT, query: '  二维码  ', reducedMotion: false });
    const raw = mount({ tools: TOOLS, layout: EMPTY_LAYOUT, query: '二维码', reducedMotion: false });
    expect(trimmed.highlightIds).toEqual(raw.highlightIds);
  });
});

describe('useOrbitHighlight · reducedMotion 联动（M5 守卫）', () => {
  // 两个节点：hit 在原点，near 在右侧 90px（< radius=190，正常应被推开）
  const hitNode: OrbitNode = {
    toolId: 'simple-calculator',
    categoryId: 'everyday',
    ringIndex: 0,
    indexInRing: 0,
    theta: 0,
    bx: 0,
    by: 0,
  };
  const nearNode: OrbitNode = {
    toolId: 'qrcode-generator',
    categoryId: 'everyday',
    ringIndex: 0,
    indexInRing: 1,
    theta: 0,
    bx: 90,
    by: 0,
  };
  const LAYOUT = {
    config: { breakpoint: 'lg' },
    nodes: [hitNode, nearNode],
  } as unknown as OrbitLayout;

  it('正常模式：近邻被推开（dx>0，state=pushed），匹配项放大提层不位移', () => {
    const r = mount({ tools: TOOLS, layout: LAYOUT, query: '简易', reducedMotion: false });

    const hit = r.transforms['simple-calculator'];
    expect(hit.dx).toBe(0);
    expect(hit.dy).toBe(0);
    expect(hit.scale).toBe(REPULSION_DEFAULT.matchedScale);
    expect(hit.z).toBe(ORBIT_Z.matched);
    expect(hit.state).toBe('matched');

    const near = r.transforms['qrcode-generator'];
    expect(near.dx).toBeGreaterThan(0);
    expect(near.state).toBe('pushed');
  });

  it('reducedMotion=true：位移归零，但高亮放大 / 变暗态保留', () => {
    const r = mount({ tools: TOOLS, layout: LAYOUT, query: '简易', reducedMotion: true });

    const hit = r.transforms['simple-calculator'];
    expect(hit.dx).toBe(0);
    expect(hit.dy).toBe(0);
    expect(hit.scale).toBe(REPULSION_DEFAULT.matchedScale); // 高亮放大保留
    expect(hit.state).toBe('matched');

    const near = r.transforms['qrcode-generator'];
    expect(near.dx).toBe(0); // 位移被归零
    expect(near.dy).toBe(0);
    expect(near.scale).toBe(REPULSION_DEFAULT.dimmedScale); // 变暗保留
    expect(near.opacity).toBe(REPULSION_DEFAULT.dimmedOpacity);
    expect(near.state).toBe('pushed');
  });
});
