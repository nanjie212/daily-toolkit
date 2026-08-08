/**
 * 排斥内核（repulsion）的数值断言。
 *
 * 锁死四条核心语义：
 * 1. 方向必须**背离**高亮项（夹角 < 1e-6）；
 * 2. 幅值随距离**单调不增**，且恒 <= maxOffset；
 * 3. 高亮项**自身位移恒为 0**（匹配项之间互不排斥）；
 * 4. 多源叠加先向量求和、再除以 √源数、最后钳幅——三步都要能被数值复现。
 *
 * 环境：vitest `environment: 'node'`——本文件零 React、零 DOM 引用。
 */

import { describe, it, expect } from 'vitest';
import { computeRepulsion, falloffValue } from '@/lib/orbit/repulsion';
import { ORBIT_Z, REPULSION_DEFAULT } from '@/lib/orbit/orbitConstants';
import type { OrbitNode, RepulsionConfig } from '@/lib/orbit/types';

const CFG: RepulsionConfig = { ...REPULSION_DEFAULT };

/** 构造一个只关心坐标的轨道节点 */
function node(toolId: string, bx: number, by: number): OrbitNode {
  return { toolId, categoryId: 'everyday', ringIndex: 0, indexInRing: 0, theta: 0, bx, by };
}

/** 单源下的解析解：`strength · falloff(d)`，未钳幅 */
function analyticMagnitude(dist: number, cfg: RepulsionConfig): number {
  return Math.min(cfg.maxOffset, cfg.strength * falloffValue(dist, cfg.radius, cfg.falloff));
}

describe('falloffValue · 距离衰减', () => {
  it('半径外为 0、圆心处为 1、二次衰减比线性更柔和', () => {
    expect(falloffValue(200, 190, 'quadratic')).toBe(0);
    expect(falloffValue(190, 190, 'quadratic')).toBe(0);
    expect(falloffValue(0, 190, 'quadratic')).toBe(1);
    expect(falloffValue(95, 190, 'linear')).toBeCloseTo(0.5, 10);
    expect(falloffValue(95, 190, 'quadratic')).toBeCloseTo(0.25, 10);
  });

  it('非法半径与非法距离安全返回 0', () => {
    expect(falloffValue(10, 0, 'quadratic')).toBe(0);
    expect(falloffValue(10, -5, 'linear')).toBe(0);
    expect(falloffValue(Number.NaN, 190, 'quadratic')).toBe(0);
  });
});

describe('computeRepulsion · 恒等与开关', () => {
  const nodes = [node('a', 0, 0), node('b', 60, 0), node('c', 0, 60)];

  it('空高亮集 → 全部恒等', () => {
    const out = computeRepulsion(nodes, new Set(), CFG);
    for (const n of nodes) {
      expect(out[n.toolId]).toEqual({
        dx: 0,
        dy: 0,
        scale: 1,
        opacity: 1,
        z: ORBIT_Z.item,
        state: 'idle',
      });
    }
  });

  it('enabled = false → 全部恒等（供 prefers-reduced-motion 走这条分支）', () => {
    const out = computeRepulsion(nodes, new Set(['a']), { ...CFG, enabled: false });
    for (const n of nodes) {
      expect(out[n.toolId].dx).toBe(0);
      expect(out[n.toolId].dy).toBe(0);
      expect(out[n.toolId].scale).toBe(1);
      expect(out[n.toolId].state).toBe('idle');
    }
  });

  it('高亮 id 与当前布局无交集 → 恒等（不平白把全场压暗）', () => {
    const out = computeRepulsion(nodes, new Set(['not-in-layout']), CFG);
    for (const n of nodes) expect(out[n.toolId].state).toBe('idle');
  });

  it('输出覆盖全部节点，一个都不漏', () => {
    const out = computeRepulsion(nodes, new Set(['a']), CFG);
    expect(Object.keys(out).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('computeRepulsion · 匹配项自身', () => {
  it('位移恒为 0，只放大 + 提层', () => {
    const nodes = [node('hit1', 0, 0), node('hit2', 40, 0), node('other', 300, 300)];
    const out = computeRepulsion(nodes, new Set(['hit1', 'hit2']), CFG);

    for (const id of ['hit1', 'hit2']) {
      expect(out[id].dx).toBe(0);
      expect(out[id].dy).toBe(0);
      expect(out[id].scale).toBe(CFG.matchedScale);
      expect(out[id].opacity).toBe(1);
      expect(out[id].z).toBe(ORBIT_Z.matched);
      expect(out[id].state).toBe('matched');
    }
  });

  it('未匹配项一律变暗，影响圈外的项 state 为 dimmed 且零位移', () => {
    const nodes = [node('hit', 0, 0), node('far', 1000, 0)];
    const out = computeRepulsion(nodes, new Set(['hit']), CFG);

    expect(out.far.scale).toBe(CFG.dimmedScale);
    expect(out.far.opacity).toBe(CFG.dimmedOpacity);
    expect(out.far.state).toBe('dimmed');
    expect(out.far.z).toBe(ORBIT_Z.item);
    expect(out.far.dx).toBe(0);
    expect(out.far.dy).toBe(0);
  });
});

describe('computeRepulsion · 单源方向与幅值', () => {
  it('位移方向与「邻居 - 高亮项」完全同向（夹角 < 1e-6）', () => {
    const hit = node('hit', 120, -80);
    const dirs = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [0.6, 0.8],
      [-0.28, 0.96],
    ];

    for (const [ux, uy] of dirs) {
      const dist = 100;
      const neighbor = node('n', hit.bx + ux * dist, hit.by + uy * dist);
      const out = computeRepulsion([hit, neighbor], new Set(['hit']), CFG);
      const { dx, dy } = out.n;

      const mag = Math.hypot(dx, dy);
      expect(mag).toBeGreaterThan(0);

      // 夹角 = acos(单位向量点积)，同向时为 0
      const dot = (dx / mag) * ux + (dy / mag) * uy;
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      expect(angle).toBeLessThan(1e-6);
    }
  });

  it('幅值随距离单调不增，且恒 <= maxOffset', () => {
    const hit = node('hit', 0, 0);
    let prev = Number.POSITIVE_INFINITY;

    for (let d = 1; d <= 260; d += 1) {
      const out = computeRepulsion([hit, node('n', d, 0)], new Set(['hit']), CFG);
      const mag = Math.hypot(out.n.dx, out.n.dy);

      expect(mag).toBeLessThanOrEqual(CFG.maxOffset + 1e-9);
      expect(mag).toBeLessThanOrEqual(prev + 1e-9);
      prev = mag;
    }
    expect(prev).toBe(0); // 超出影响半径后归零
  });

  it('单源幅值等于解析解 min(maxOffset, strength × falloff(d))', () => {
    const hit = node('hit', 0, 0);
    for (const d of [20, 45, 80, 120, 160, 185]) {
      const out = computeRepulsion([hit, node('n', 0, d)], new Set(['hit']), CFG);
      expect(Math.hypot(out.n.dx, out.n.dy)).toBeCloseTo(analyticMagnitude(d, CFG), 9);
    }
  });

  it('极近距离必被钳制到恰好 maxOffset', () => {
    const out = computeRepulsion([node('hit', 0, 0), node('n', 5, 0)], new Set(['hit']), CFG);
    expect(Math.hypot(out.n.dx, out.n.dy)).toBeCloseTo(CFG.maxOffset, 9);
    expect(out.n.state).toBe('pushed');
    expect(out.n.z).toBe(ORBIT_Z.pushed);
  });

  it('与高亮项重合（距离 < 1e-3）时跳过该源，不产生 NaN', () => {
    const out = computeRepulsion([node('hit', 0, 0), node('n', 0, 0)], new Set(['hit']), CFG);
    expect(out.n.dx).toBe(0);
    expect(out.n.dy).toBe(0);
    expect(Number.isNaN(out.n.dx)).toBe(false);
    expect(out.n.state).toBe('dimmed');
  });
});

describe('computeRepulsion · 多源叠加', () => {
  it('对称包围时向量互相抵消，合位移趋近 0', () => {
    const nodes = [
      node('h1', 100, 0),
      node('h2', -100, 0),
      node('h3', 0, 100),
      node('h4', 0, -100),
      node('n', 0, 0),
    ];
    const out = computeRepulsion(nodes, new Set(['h1', 'h2', 'h3', 'h4']), CFG);
    expect(Math.hypot(out.n.dx, out.n.dy)).toBeLessThan(1e-9);
  });

  it('多源同侧：结果 = Σ(权重·单位向量) ÷ √源数，再钳幅', () => {
    // 三个高亮源都在节点左侧不同距离处，推力方向一致（+x）。
    //
    // 距离标定说明：原用 [100, 130, 170]，但按 CFG 真实参数
    // （strength=46 / radius=190 / quadratic）计算，未钳制合力仅 ≈8.9px，
    // 达不到 maxOffset=28，导致「钳制生效」的前提不成立。
    // 实测 [30, 50, 70] 的未钳制合力 ≈43.9px ≈ 1.57×maxOffset——
    // 既能验证 Σ(权重·单位向量) ÷ √源数 的叠加公式（源距仍各不相同），
    // 又能保证下方「钳制后恰好落在 maxOffset」的断言真的被触发。
    const distances = [30, 50, 70];
    const target = node('n', 0, 0);
    const sources = distances.map((d, i) => node(`h${i}`, -d, 0));
    const cfg: RepulsionConfig = { ...CFG, maxOffset: 1000 }; // 先关掉钳制看纯叠加

    const out = computeRepulsion([...sources, target], new Set(sources.map((s) => s.toolId)), cfg);

    const expected =
      distances.reduce((acc, d) => acc + cfg.strength * falloffValue(d, cfg.radius, cfg.falloff), 0) /
      Math.sqrt(distances.length);

    expect(out.n.dx).toBeCloseTo(expected, 9);
    expect(out.n.dy).toBeCloseTo(0, 9);

    // 再开钳制：同一组输入必须恰好落在 maxOffset 上
    const clamped = computeRepulsion(
      [...sources, target],
      new Set(sources.map((s) => s.toolId)),
      CFG,
    );
    expect(expected).toBeGreaterThan(CFG.maxOffset); // 前提成立：未钳制时确实超限
    expect(Math.hypot(clamped.n.dx, clamped.n.dy)).toBeCloseTo(CFG.maxOffset, 9);
  });

  it('√n 归一确实抑制了爆量：n 个等效源的合力 = 单源的 √n 倍而非 n 倍', () => {
    const cfg: RepulsionConfig = { ...CFG, maxOffset: 10000 };
    const dist = 150;

    const single = computeRepulsion(
      [node('h0', -dist, 0), node('n', 0, 0)],
      new Set(['h0']),
      cfg,
    );
    const singleMag = Math.hypot(single.n.dx, single.n.dy);

    // 4 个方向几乎一致、距离相同的源（沿 y 轴微错开，保证不重合）
    const sources = [0, 1, 2, 3].map((i) => node(`h${i}`, -dist, (i - 1.5) * 1e-4));
    const many = computeRepulsion(
      [...sources, node('n', 0, 0)],
      new Set(sources.map((s) => s.toolId)),
      cfg,
    );
    const manyMag = Math.hypot(many.n.dx, many.n.dy);

    expect(manyMag / singleMag).toBeCloseTo(Math.sqrt(4), 4);
  });

  it('只取最近的 maxSources 个源：多出来的远源不再贡献', () => {
    const cfg: RepulsionConfig = { ...CFG, maxSources: 3, maxOffset: 10000 };
    const target = node('n', 0, 0);

    const near = [60, 70, 80].map((d, i) => node(`near${i}`, -d, 0));
    const extra = [150, 160, 170, 180].map((d, i) => node(`extra${i}`, -d, 0));

    const onlyNear = computeRepulsion(
      [...near, target],
      new Set(near.map((s) => s.toolId)),
      cfg,
    );
    const withExtra = computeRepulsion(
      [...near, ...extra, target],
      new Set([...near, ...extra].map((s) => s.toolId)),
      cfg,
    );

    expect(withExtra.n.dx).toBeCloseTo(onlyNear.n.dx, 9);
    expect(withExtra.n.dy).toBeCloseTo(onlyNear.n.dy, 9);
  });

  it('无论多少高亮源，幅值都不会突破 maxOffset', () => {
    const target = node('n', 0, 0);
    const sources = Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI; // 半圈内，方向不会完全抵消
      return node(`h${i}`, -Math.cos(a) * 40 - 20, -Math.sin(a) * 40);
    });

    const out = computeRepulsion(
      [...sources, target],
      new Set(sources.map((s) => s.toolId)),
      CFG,
    );
    expect(Math.hypot(out.n.dx, out.n.dy)).toBeLessThanOrEqual(CFG.maxOffset + 1e-9);
  });
});
