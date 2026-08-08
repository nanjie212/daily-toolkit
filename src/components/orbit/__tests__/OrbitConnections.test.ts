/**
 * buildOrbitEdges 纯函数断言（docs/orbit-v2-visual-spec.md §6 / §7 T02）。
 *
 * 环境：vitest `environment: 'node'`——本文件零 React、零 DOM 引用。
 *
 * 覆盖：
 * 1. 3 节点同环 → 3 条边（i→i+1 首尾闭环）；
 * 2. 环内 <2 节点不产生边（避免零长度自连）；
 * 3. 跨分类段（不同 categoryId）→ 该边被跳过；skipCrossSegment: false 时保留；
 * 4. crossRingSpoke: true → 每节点连到下一环最近节点；默认 false → 无跨环边；
 * 5. 边颜色 = 发送方分类（categoryId = from.categoryId）。
 */

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildOrbitEdges } from '@/components/orbit/OrbitConnections';
import type { OrbitNode } from '@/lib/orbit/types';

/** 构造最小可用的 OrbitNode（缺省 everyday / 环 0 / 序号 0 / 原点） */
function makeNode(partial: Partial<OrbitNode> & { toolId: string }): OrbitNode {
  return {
    categoryId: 'everyday',
    ringIndex: 0,
    indexInRing: 0,
    theta: 0,
    bx: 0,
    by: 0,
    ...partial,
  };
}

describe('buildOrbitEdges · 同环下一个（首尾闭环）', () => {
  it('3 节点同环 → 3 条边（i→i+1，末项回连首项）', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0, bx: 100, by: 0 }),
      makeNode({ toolId: 'b', ringIndex: 0, indexInRing: 1, bx: 0, by: 100 }),
      makeNode({ toolId: 'c', ringIndex: 0, indexInRing: 2, bx: -100, by: 0 }),
    ];
    const edges = buildOrbitEdges(nodes);
    expect(edges).toHaveLength(3);
    expect(edges.map((e) => [e.from.toolId, e.to.toolId])).toEqual([
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ]);
  });

  it('环内 <2 节点不产生边（避免零长度自连）', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'only', ringIndex: 0, indexInRing: 0 }),
    ];
    expect(buildOrbitEdges(nodes)).toHaveLength(0);
  });

  it('sameRingNext: false 时不生成同环边', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0 }),
      makeNode({ toolId: 'b', ringIndex: 0, indexInRing: 1 }),
    ];
    expect(buildOrbitEdges(nodes, { sameRingNext: false })).toHaveLength(0);
  });

  it('多环各自闭环：2 环 × 2 节点 → 4 条边', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0 }),
      makeNode({ toolId: 'b', ringIndex: 0, indexInRing: 1 }),
      makeNode({ toolId: 'c', ringIndex: 1, indexInRing: 0 }),
      makeNode({ toolId: 'd', ringIndex: 1, indexInRing: 1 }),
    ];
    const edges = buildOrbitEdges(nodes);
    expect(edges).toHaveLength(4);
    // 跨环绝不产生边（默认 crossRingSpoke: false）
    expect(edges.every((e) => e.from.ringIndex === e.to.ringIndex)).toBe(true);
  });
});

describe('buildOrbitEdges · 跨分类段', () => {
  it('skipCrossSegment 默认 true：跨分类段被跳过', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0, categoryId: 'everyday' }),
      makeNode({ toolId: 'b', ringIndex: 0, indexInRing: 1, categoryId: 'finance' }),
      makeNode({ toolId: 'c', ringIndex: 0, indexInRing: 2, categoryId: 'everyday' }),
    ];
    const edges = buildOrbitEdges(nodes);
    // a→b 跨分类跳过；b→c 跨分类跳过；c→a 同分类保留
    expect(edges).toHaveLength(1);
    expect(edges[0].from.toolId).toBe('c');
    expect(edges[0].to.toolId).toBe('a');
  });

  it('skipCrossSegment: false 时跨分类段保留', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0, categoryId: 'everyday' }),
      makeNode({ toolId: 'b', ringIndex: 0, indexInRing: 1, categoryId: 'finance' }),
      makeNode({ toolId: 'c', ringIndex: 0, indexInRing: 2, categoryId: 'everyday' }),
    ];
    const edges = buildOrbitEdges(nodes, { skipCrossSegment: false });
    expect(edges).toHaveLength(3);
  });
});

describe('buildOrbitEdges · 跨环 spoke（默认关）', () => {
  const twoRingNodes: OrbitNode[] = [
    makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0, bx: 0, by: 0 }),
    makeNode({ toolId: 'b', ringIndex: 1, indexInRing: 0, bx: 100, by: 0 }),
    makeNode({ toolId: 'c', ringIndex: 1, indexInRing: 1, bx: 90, by: 50 }),
  ];

  it('默认 false → 无跨环边（只有同环闭环边）', () => {
    const edges = buildOrbitEdges(twoRingNodes);
    expect(edges).toHaveLength(2); // ring1 上 b→c、c→b
    expect(edges.every((e) => e.from.ringIndex === e.to.ringIndex)).toBe(true);
  });

  it('crossRingSpoke: true → 每节点连到下一环欧氏距离最近节点', () => {
    const edges = buildOrbitEdges(twoRingNodes, { crossRingSpoke: true, sameRingNext: false });
    // ring0 只有 a 一个节点：a 连到 b（100² vs 90²+50²=10600，b 更近）
    expect(edges).toHaveLength(1);
    expect(edges[0].from.toolId).toBe('a');
    expect(edges[0].to.toolId).toBe('b');
  });
});

describe('buildOrbitEdges · 边颜色', () => {
  it('categoryId = 发送方分类（D2 分类色相）', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0, categoryId: 'finance' }),
      makeNode({ toolId: 'b', ringIndex: 0, indexInRing: 1, categoryId: 'finance' }),
      makeNode({ toolId: 'c', ringIndex: 0, indexInRing: 2, categoryId: 'everyday' }),
    ];
    const edges = buildOrbitEdges(nodes);
    // a→b finance；b→c 跨分类跳过；c→a 跨分类跳过 → 只有一条 finance 边
    expect(edges).toHaveLength(1);
    expect(edges[0].categoryId).toBe('finance');
    expect(edges[0].from.categoryId).toBe(edges[0].categoryId);
  });
});

describe('buildOrbitEdges · 边界', () => {
  it('空节点集 → 空边集', () => {
    expect(buildOrbitEdges([])).toHaveLength(0);
  });

  it('opts 不传 / 传空对象都走默认值', () => {
    const nodes: OrbitNode[] = [
      makeNode({ toolId: 'a', ringIndex: 0, indexInRing: 0 }),
      makeNode({ toolId: 'b', ringIndex: 0, indexInRing: 1 }),
    ];
    expect(buildOrbitEdges(nodes, {})).toEqual(buildOrbitEdges(nodes));
  });
});
