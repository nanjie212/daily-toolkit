/**
 * 排斥内核：搜索命中时，把未命中的邻居「推开」，给高亮项让出空间。
 *
 * ## 语义（docs/system_design.md §3.5）
 *
 * - 位移方向 = `高亮项 → 邻居` 的**单位向量**，即径向**背离**高亮项推开。
 * - **匹配项之间互不排斥**：H 内元素位移恒为 0。否则多命中时整个环会集体炸开，观感失控。
 * - 多源叠加做**能量归一**：`d /= √(生效源数)`。
 *   直接求和会让「被一堆高亮包围」的节点获得离谱的位移；
 *   除以 √n 是把 n 个近似独立的随机方向向量之和还原回单源量级的标准做法
 *   （n 个单位向量随机相加的期望模长正比于 √n）。
 * - 只取**最近的 maxSources 个**源：远处高亮的贡献本就趋近 0，
 *   截断既省算力，又避免大匹配集下四面八方的方向互相抵消成数值噪声。
 * - 最后统一**钳制幅值**到 `maxOffset`（28px），保证不会推出可视区、不会跨环撞车。
 *
 * ## 复杂度
 *
 * O(n × m)，n = 节点数（66），m = 高亮数（≤66）→ 最坏 4,356 次距离运算，量级 <0.1ms。
 * 纯同步函数，只在 query 变化时跑一次，**不需要 rAF 循环、不需要 Web Worker**。
 *
 * 纯 TS：零 React、零 DOM。
 */

import { ORBIT_Z, REPULSION_DEFAULT } from './orbitConstants';
import type { FalloffKind, OrbitNode, OrbitTransform, RepulsionConfig } from './types';

/** 同点保护阈值：距离小于它就认为两项重合，方向无意义，直接跳过 */
const COINCIDENT_EPS = 1e-3;

/**
 * 距离衰减系数，返回 [0, 1]。
 *
 * `t = 1 - dist/radius`；quadratic 用 `t²`，边缘处导数为 0，收尾更柔和，
 * 不会出现「刚进入影响圈就被猛地一顶」的突兀感。
 */
export function falloffValue(dist: number, radius: number, kind: FalloffKind): number {
  if (!(radius > 0) || !Number.isFinite(dist)) return 0;
  if (dist >= radius) return 0;
  if (dist <= 0) return 1;
  const t = 1 - dist / radius;
  return kind === 'quadratic' ? t * t : t;
}

/** 未搜索 / 未启用时的恒等视觉态 */
function idleTransform(): OrbitTransform {
  return { dx: 0, dy: 0, scale: 1, opacity: 1, z: ORBIT_Z.item, state: 'idle' };
}

function identityResult(nodes: readonly OrbitNode[]): Record<string, OrbitTransform> {
  const out: Record<string, OrbitTransform> = {};
  for (const node of nodes) out[node.toolId] = idleTransform();
  return out;
}

interface Source {
  /** 邻居 - 高亮源 的向量（即背离方向） */
  vx: number;
  vy: number;
  dist: number;
}

/**
 * 计算每个节点的排斥位移与视觉态。
 *
 * @param nodes        全部轨道节点（静态落位，来自 `computeOrbitLayout`）
 * @param highlightIds 命中搜索的工具 id 集合
 * @param cfg          排斥参数，默认取 `REPULSION_DEFAULT`
 */
export function computeRepulsion(
  nodes: readonly OrbitNode[],
  highlightIds: ReadonlySet<string>,
  cfg: RepulsionConfig = REPULSION_DEFAULT,
): Record<string, OrbitTransform> {
  if (!cfg.enabled || highlightIds.size === 0) return identityResult(nodes);

  const sources = nodes.filter((n) => highlightIds.has(n.toolId));
  // 高亮集合与当前布局无交集 → 没有任何可高亮的东西，保持恒等，不要平白把全场压暗
  if (sources.length === 0) return identityResult(nodes);

  const maxSources = Math.max(1, Math.floor(cfg.maxSources));
  const out: Record<string, OrbitTransform> = {};

  for (const node of nodes) {
    if (highlightIds.has(node.toolId)) {
      // 匹配项：不位移，只放大 + 提层（发光交给 class）
      out[node.toolId] = {
        dx: 0,
        dy: 0,
        scale: cfg.matchedScale,
        opacity: 1,
        z: ORBIT_Z.matched,
        state: 'matched',
      };
      continue;
    }

    // ① 收集影响半径内的高亮源
    const candidates: Source[] = [];
    for (const src of sources) {
      const vx = node.bx - src.bx;
      const vy = node.by - src.by;
      const dist = Math.sqrt(vx * vx + vy * vy);
      if (dist >= cfg.radius || dist < COINCIDENT_EPS) continue;
      candidates.push({ vx, vy, dist });
    }

    // ② 只留最近的 maxSources 个
    if (candidates.length > maxSources) {
      candidates.sort((a, b) => a.dist - b.dist);
      candidates.length = maxSources;
    }

    // ③ 加权叠加背离方向的单位向量
    let ax = 0;
    let ay = 0;
    for (const c of candidates) {
      const w = cfg.strength * falloffValue(c.dist, cfg.radius, cfg.falloff);
      ax += (w * c.vx) / c.dist;
      ay += (w * c.vy) / c.dist;
    }

    // ④ 多源能量归一
    const hit = candidates.length;
    if (hit > 1) {
      const norm = Math.sqrt(hit);
      ax /= norm;
      ay /= norm;
    }

    // ⑤ 幅值钳制
    const mag = Math.sqrt(ax * ax + ay * ay);
    if (mag > cfg.maxOffset && mag > 0) {
      const s = cfg.maxOffset / mag;
      ax *= s;
      ay *= s;
    }

    out[node.toolId] = {
      dx: ax,
      dy: ay,
      scale: cfg.dimmedScale,
      opacity: cfg.dimmedOpacity,
      z: hit > 0 ? ORBIT_Z.pushed : ORBIT_Z.item,
      state: hit > 0 ? 'pushed' : 'dimmed',
    };
  }

  return out;
}
