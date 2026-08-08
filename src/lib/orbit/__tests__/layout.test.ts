/**
 * 轨道布局内核（ellipse / layout）的数值断言。
 *
 * 这些用例锁死的是**几何正确性**，不涉及任何渲染：
 * 66 个工具必须全部落位、任意两项不重叠、全部落在舞台内、
 * 同分类连续不交错、环序符合 `categories.order`，且四种真实视口尺寸下都成立。
 *
 * 环境：vitest `environment: 'node'`——本文件零 React、零 DOM 引用。
 */

import { describe, it, expect } from 'vitest';
import { builtInTools } from '@/tools';
import { categories } from '@/tools/categories';
import {
  arcLengthAtTheta,
  buildArcTable,
  ellipsePerimeter,
  normalizeAngle,
  perimeterFactor,
  pointAt,
  thetaAtArcLength,
} from '@/lib/orbit/ellipse';
import {
  computeOrbitLayout,
  groupByCategory,
  planRings,
  resolveBreakpoint,
  resolveConfig,
  resolveGeometry,
  ringStartOffset,
} from '@/lib/orbit/layout';
import { computeRepulsion } from '@/lib/orbit/repulsion';
import { CATEGORY_RING_ORDER, ORBIT_Z, REPULSION_DEFAULT } from '@/lib/orbit/orbitConstants';
import type { OrbitLayout, OrbitNode, StageBox } from '@/lib/orbit/types';

/** 设计稿核实过的工具总数（everyday 27 / finance 6 / health 7 / image 15 / fun 11） */
const TOTAL_TOOLS = 66;

/** 真实视口对应的舞台尺寸矩阵（宽 × 高，已扣掉品牌条与留白） */
const STAGES: { label: string; stage: StageBox }[] = [
  { label: '小笔记本 1024×640', stage: { width: 1024, height: 640 } },
  { label: '常见笔记本 1280×700', stage: { width: 1280, height: 700 } },
  { label: '设计基准 1440×760', stage: { width: 1440, height: 760 } },
  { label: '大屏 1920×900', stage: { width: 1920, height: 900 } },
];

const BASE_STAGE: StageBox = { width: 1440, height: 760 };

/** 任意两项中心距的下限：项最小边长的 90% */
function minSeparation(layout: OrbitLayout): number {
  return Math.min(layout.config.itemW, layout.config.itemH) * 0.9;
}

/** 返回布局里最近的一对节点及其距离 */
function closestPair(nodes: readonly OrbitNode[]): { dist: number; a: string; b: string } {
  let best = { dist: Number.POSITIVE_INFINITY, a: '', b: '' };
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].bx - nodes[j].bx;
      const dy = nodes[i].by - nodes[j].by;
      const dist = Math.hypot(dx, dy);
      if (dist < best.dist) best = { dist, a: nodes[i].toolId, b: nodes[j].toolId };
    }
  }
  return best;
}

/** 按视觉次序（环号 → 环内序号）排好的节点 */
function inVisualOrder(nodes: readonly OrbitNode[]): OrbitNode[] {
  return [...nodes].sort((a, b) => a.ringIndex - b.ringIndex || a.indexInRing - b.indexInRing);
}

describe('工具数据前提', () => {
  it('内置工具共 66 个，且分类计数与设计稿一致', () => {
    expect(builtInTools).toHaveLength(TOTAL_TOOLS);

    const counts = builtInTools.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ everyday: 27, finance: 6, health: 7, image: 15, fun: 11 });
  });
});

describe('ellipse · 椭圆几何', () => {
  it('perimeterFactor 在 k=1 时退化为 2π（正圆闭式精确）', () => {
    expect(perimeterFactor(1)).toBeCloseTo(Math.PI * 2, 10);
    expect(perimeterFactor(0)).toBe(0);
    expect(perimeterFactor(-1)).toBe(0);
  });

  it('Ramanujan 周长与 720 点折线累积弧长的偏差 < 0.01%', () => {
    const rx = 543;
    const ry = 288;
    const closed = ellipsePerimeter(rx, ry);
    const table = buildArcTable(rx, ry, 720);
    expect(Math.abs(table.total - closed) / closed).toBeLessThan(1e-4);
  });

  it('thetaAtArcLength 与 arcLengthAtTheta 互为逆运算', () => {
    const table = buildArcTable(400, 220, 720);
    for (let i = 0; i < 24; i += 1) {
      const theta = (i / 24) * Math.PI * 2;
      const roundTrip = thetaAtArcLength(table, arcLengthAtTheta(table, theta));
      expect(roundTrip).toBeCloseTo(theta, 4);
    }
  });

  it('等弧长采样确实等距：相邻点弦长的极差 < 平均值的 8%', () => {
    const rx = 500;
    const ry = 260;
    const table = buildArcTable(rx, ry, 720);
    const n = 30;

    const equalArc: number[] = [];
    for (let i = 0; i < n; i += 1) {
      const p0 = pointAt(rx, ry, thetaAtArcLength(table, (table.total * i) / n));
      const p1 = pointAt(rx, ry, thetaAtArcLength(table, (table.total * (i + 1)) / n));
      equalArc.push(Math.hypot(p1.x - p0.x, p1.y - p0.y));
    }

    const spread = (xs: number[]) =>
      (Math.max(...xs) - Math.min(...xs)) / (xs.reduce((a, b) => a + b, 0) / xs.length);

    expect(spread(equalArc)).toBeLessThan(0.08);
  });

  it('对照组：等角度采样的间距极差显著大于等弧长（证明等弧长参数化的必要性）', () => {
    const rx = 500;
    const ry = 260;
    const table = buildArcTable(rx, ry, 720);
    const n = 30;

    // 等弧长：按弧长等分后再反查角度；等角度：直接按 θ = 2πi/n 等分。
    const equalArc: number[] = [];
    const equalAngle: number[] = [];
    for (let i = 0; i < n; i += 1) {
      const p0 = pointAt(rx, ry, thetaAtArcLength(table, (table.total * i) / n));
      const p1 = pointAt(rx, ry, thetaAtArcLength(table, (table.total * (i + 1)) / n));
      equalArc.push(Math.hypot(p1.x - p0.x, p1.y - p0.y));

      const q0 = pointAt(rx, ry, ((Math.PI * 2) / n) * i);
      const q1 = pointAt(rx, ry, ((Math.PI * 2) / n) * (i + 1));
      equalAngle.push(Math.hypot(q1.x - q0.x, q1.y - q0.y));
    }

    const spread = (xs: number[]) =>
      (Math.max(...xs) - Math.min(...xs)) / (xs.reduce((a, b) => a + b, 0) / xs.length);

    // 实测值（rx=500, ry=260, n=30）：equalArc ≈ 0.012，equalAngle ≈ 0.606，比值 ≈ 50。
    // 原断言 spread(equalAngle) > 0.8 在该椭圆参数下数学上达不到（真实约 0.61），
    // 属测试标定问题而非源码问题。改为「等角极差 ≥ 等弧长极差的 3 倍」：
    // 实测约 50 倍、余量极大且稳定成立，同时直接证明「等弧长参数化消除了间距不均」。
    expect(spread(equalAngle)).toBeGreaterThan(spread(equalArc) * 3);
    // 再保留一个绝对下界：等角度采样确实是肉眼可见的不均匀（极差 > 均值的 40%）。
    expect(spread(equalAngle)).toBeGreaterThan(0.4);
  });

  it('normalizeAngle 把任意弧度折回 [0, 2π)', () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 10);
    expect(normalizeAngle(Math.PI * 4.5)).toBeCloseTo(Math.PI * 0.5, 10);
  });
});

describe('layout · 配置与环规划', () => {
  it('断点按宽度判定', () => {
    expect(resolveBreakpoint(390)).toBe('sm');
    expect(resolveBreakpoint(768)).toBe('md');
    expect(resolveBreakpoint(1440)).toBe('lg');
  });

  it('T05 尺寸矩阵：<640 一律 sm（走 OrbitFallback），>=640 走 md/lg 圆环', () => {
    // 手机 375/390/414 → sm（降级视图）；平板/桌面 768/1024/1440/1920 → md/lg（圆环）
    for (const w of [375, 390, 414, 639]) expect(resolveBreakpoint(w)).toBe('sm');
    for (const w of [640, 768, 1024, 1440, 1920]) expect(resolveBreakpoint(w)).not.toBe('sm');
  });

  it('T05 尺寸矩阵：md/lg 圆环档均能无溢出装下 66 项', () => {
    for (const stage of [
      { width: 640, height: 900 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      const layout = computeOrbitLayout(builtInTools, stage);
      expect(layout.overflowIds, `${stage.width}×${stage.height}`).toEqual([]);
      expect(layout.nodes).toHaveLength(TOTAL_TOOLS);
    }
  });

  it('环半径等差、ry = rx·k，且外环不越界', () => {
    const cfg = resolveConfig(BASE_STAGE);
    const geo = resolveGeometry(BASE_STAGE, cfg);
    const rings = planRings(BASE_STAGE, cfg, cfg.slotIdeal, 4);

    expect(rings).toHaveLength(4);
    const steps = rings.slice(1).map((r, i) => r.rx - rings[i].rx);
    for (const s of steps) expect(s).toBeCloseTo(steps[0], 6);

    for (const ring of rings) {
      expect(ring.ry).toBeCloseTo(ring.rx * geo.k, 6);
      expect(ring.rx + cfg.itemW / 2).toBeLessThanOrEqual(BASE_STAGE.width / 2);
      expect(ring.ry + cfg.itemH / 2).toBeLessThanOrEqual(BASE_STAGE.height / 2);
      expect(ring.capacity).toBeGreaterThan(0);
    }
  });

  it('每环起始角按 0.37rad 递增错位，避免各环连成竖直「柱子」', () => {
    expect(ringStartOffset(0)).toBeCloseTo(-Math.PI / 2, 10);
    expect(ringStartOffset(1) - ringStartOffset(0)).toBeCloseTo(0.37, 10);
    expect(ringStartOffset(3) - ringStartOffset(2)).toBeCloseTo(0.37, 10);
  });

  it('groupByCategory 按 categories.order 排序且组内保持原始顺序', () => {
    const groups = groupByCategory(builtInTools);
    expect(groups.map((g) => g.categoryId)).toEqual(CATEGORY_RING_ORDER);
    expect(groups.reduce((acc, g) => acc + g.toolIds.length, 0)).toBe(TOTAL_TOOLS);

    const everyday = groups[0];
    const declared = builtInTools.filter((t) => t.category === 'everyday').map((t) => t.id);
    expect(everyday.toolIds).toEqual(declared);
  });
});

describe('computeOrbitLayout · 设计基准 1440×760', () => {
  const layout = computeOrbitLayout(builtInTools, BASE_STAGE);

  it('66 项全部落位，无遗漏、无溢出、无重复', () => {
    expect(layout.nodes).toHaveLength(TOTAL_TOOLS);
    expect(layout.overflowIds).toEqual([]);
    expect(Object.keys(layout.nodeById)).toHaveLength(TOTAL_TOOLS);

    const placed = new Set(layout.nodes.map((n) => n.toolId));
    expect(placed.size).toBe(TOTAL_TOOLS);
    for (const tool of builtInTools) expect(placed.has(tool.id)).toBe(true);
  });

  it('任意两项中心距 >= min(itemW, itemH) × 0.9（无重叠）', () => {
    const pair = closestPair(layout.nodes);
    expect(pair.dist).toBeGreaterThanOrEqual(minSeparation(layout));
  });

  it('所有项完整落在舞台内（含项自身尺寸，不越界）', () => {
    const halfW = layout.stage.width / 2;
    const halfH = layout.stage.height / 2;
    for (const n of layout.nodes) {
      expect(Math.abs(n.bx) + layout.config.itemW / 2).toBeLessThanOrEqual(halfW);
      expect(Math.abs(n.by) + layout.config.itemH / 2).toBeLessThanOrEqual(halfH);
    }
  });

  it('同一分类在视觉次序上连续，不出现 A-B-A 交错', () => {
    const seen = new Set<string>();
    let prev = '';
    for (const node of inVisualOrder(layout.nodes)) {
      if (node.categoryId !== prev) {
        expect(seen.has(node.categoryId)).toBe(false);
        seen.add(node.categoryId);
        prev = node.categoryId;
      }
    }
    expect(seen.size).toBe(CATEGORY_RING_ORDER.length);
  });

  it('环序符合 categories.order：内圈日常、外圈图片/趣味', () => {
    const minRing = new Map<string, number>();
    for (const n of layout.nodes) {
      const cur = minRing.get(n.categoryId);
      if (cur === undefined || n.ringIndex < cur) minRing.set(n.categoryId, n.ringIndex);
    }

    const ordered = [...categories].sort((a, b) => a.order - b.order).map((c) => c.id);
    for (let i = 1; i < ordered.length; i += 1) {
      expect(minRing.get(ordered[i])!).toBeGreaterThanOrEqual(minRing.get(ordered[i - 1])!);
    }
    // 用户描述的两端：日常必在最内环，趣味必不在最内环
    expect(minRing.get('everyday')).toBe(0);
    expect(minRing.get('fun')!).toBeGreaterThan(0);
  });

  it('节点坐标与其极坐标自洽：bx = rx·cosθ、by = ry·sinθ', () => {
    for (const n of layout.nodes) {
      const ring = layout.rings[n.ringIndex];
      expect(ring).toBeDefined();
      expect(n.bx).toBeCloseTo(ring.rx * Math.cos(n.theta), 6);
      expect(n.by).toBeCloseTo(ring.ry * Math.sin(n.theta), 6);
    }
  });

  it('每环装载量不超过其容量，且分类段的 count 之和等于环内项数', () => {
    const perRing = new Map<number, number>();
    for (const n of layout.nodes) perRing.set(n.ringIndex, (perRing.get(n.ringIndex) ?? 0) + 1);

    for (const ring of layout.rings) {
      const loaded = perRing.get(ring.index) ?? 0;
      expect(loaded).toBeLessThanOrEqual(ring.capacity);
      const segTotal = ring.segments.reduce((acc, s) => acc + s.count, 0);
      expect(segTotal).toBe(loaded);
      for (const seg of ring.segments) expect(seg.endTheta).toBeGreaterThan(seg.startTheta);
    }
  });

  it('同环相邻项的弧长间距基本一致（等弧长参数化生效）', () => {
    const byRing = new Map<number, OrbitNode[]>();
    for (const n of layout.nodes) {
      const list = byRing.get(n.ringIndex) ?? [];
      list.push(n);
      byRing.set(n.ringIndex, list);
    }

    for (const [ringIndex, list] of byRing) {
      if (list.length < 3) continue;
      const ring = layout.rings[ringIndex];
      const table = buildArcTable(ring.rx, ring.ry, 720);
      const sorted = [...list].sort((a, b) => a.indexInRing - b.indexInRing);

      const gaps: number[] = [];
      for (let i = 1; i < sorted.length; i += 1) {
        let d = arcLengthAtTheta(table, sorted[i].theta) - arcLengthAtTheta(table, sorted[i - 1].theta);
        if (d < 0) d += table.total;
        gaps.push(d);
      }
      // 段间缺口会让个别间距变大，因此只校验「最小间距不小于均值的 90%」
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      expect(Math.min(...gaps)).toBeGreaterThan(avg * 0.9);
    }
  });

  it('contentW / contentH 覆盖最外环加上项尺寸，且不超过舞台', () => {
    expect(layout.contentW).toBeLessThanOrEqual(layout.stage.width);
    expect(layout.contentH).toBeLessThanOrEqual(layout.stage.height);
    expect(layout.contentW).toBeGreaterThan(0);
    expect(layout.contentH).toBeGreaterThan(0);
  });

  it('相同输入产生完全相同的输出（纯函数，可安全 memo）', () => {
    const again = computeOrbitLayout(builtInTools, { ...BASE_STAGE });
    expect(again.nodes).toEqual(layout.nodes);
    expect(again.slot).toBe(layout.slot);
    expect(again.rings.map((r) => r.rx)).toEqual(layout.rings.map((r) => r.rx));
  });
});

describe('computeOrbitLayout · 四种尺寸矩阵均不溢出', () => {
  for (const { label, stage } of STAGES) {
    it(`${label}：66 项全部落位、无重叠、不越界`, () => {
      const layout = computeOrbitLayout(builtInTools, stage);

      expect(layout.overflowIds).toEqual([]);
      expect(layout.nodes).toHaveLength(TOTAL_TOOLS);

      const pair = closestPair(layout.nodes);
      expect(pair.dist).toBeGreaterThanOrEqual(minSeparation(layout));

      const halfW = stage.width / 2;
      const halfH = stage.height / 2;
      for (const n of layout.nodes) {
        expect(Math.abs(n.bx) + layout.config.itemW / 2).toBeLessThanOrEqual(halfW);
        expect(Math.abs(n.by) + layout.config.itemH / 2).toBeLessThanOrEqual(halfH);
      }

      // 中心搜索框的安全区不得被侵入
      const innerRing = layout.rings[0];
      expect(innerRing.rx).toBeGreaterThanOrEqual(layout.config.centerSafeRx - 1e-6);
      expect(innerRing.ry).toBeGreaterThanOrEqual(layout.config.centerSafeRy - 1e-6);
    });
  }

  it('极端窄屏也不静默丢工具：落位数 + 溢出数恒等于总数', () => {
    for (const stage of [
      { width: 390, height: 620 },
      { width: 320, height: 480 },
      { width: 768, height: 1024 },
    ]) {
      const layout = computeOrbitLayout(builtInTools, stage);
      expect(layout.nodes.length + layout.overflowIds.length).toBe(TOTAL_TOOLS);
    }
  });

  it('零尺寸舞台安全降级：不抛异常，全部记入 overflow', () => {
    const layout = computeOrbitLayout(builtInTools, { width: 0, height: 0 });
    expect(layout.nodes).toEqual([]);
    expect(layout.overflowIds).toHaveLength(TOTAL_TOOLS);
  });
});

describe('layout × repulsion 联调', () => {
  it('空高亮集时排斥恒等：位移全为 0、缩放透明度归位', () => {
    const layout = computeOrbitLayout(builtInTools, BASE_STAGE);
    const transforms = computeRepulsion(layout.nodes, new Set<string>(), REPULSION_DEFAULT);

    expect(Object.keys(transforms)).toHaveLength(TOTAL_TOOLS);
    for (const node of layout.nodes) {
      expect(transforms[node.toolId]).toEqual({
        dx: 0,
        dy: 0,
        scale: 1,
        opacity: 1,
        z: ORBIT_Z.item,
        state: 'idle',
      });
    }
  });

  it('真实搜索场景下，所有 z 值都在 orbit 预算内（<= 20，绝不触碰 30/40/50）', () => {
    const layout = computeOrbitLayout(builtInTools, BASE_STAGE);
    const highlight = new Set(layout.nodes.slice(0, 5).map((n) => n.toolId));
    const transforms = computeRepulsion(layout.nodes, highlight, REPULSION_DEFAULT);

    for (const node of layout.nodes) {
      expect(transforms[node.toolId].z).toBeLessThanOrEqual(ORBIT_Z.max);
    }
  });

  it('排斥后的项仍留在舞台内（位移上限 28px 已被算进边缘余量）', () => {
    const layout = computeOrbitLayout(builtInTools, BASE_STAGE);
    const highlight = new Set(layout.nodes.slice(0, 8).map((n) => n.toolId));
    const transforms = computeRepulsion(layout.nodes, highlight, REPULSION_DEFAULT);

    for (const node of layout.nodes) {
      const t = transforms[node.toolId];
      expect(Math.hypot(t.dx, t.dy)).toBeLessThanOrEqual(REPULSION_DEFAULT.maxOffset + 1e-9);
    }
  });
});
