/**
 * 轨道布局内核：把 N 个工具摆到若干同心椭圆环上。
 *
 * ## 总体思路（docs/system_design.md §1.1 / §3.4）
 *
 * 1. **椭圆而非正圆**——视口是横向的，纵向稀缺。令 `k = ry/rx ≈ 可用高/可用宽`，
 *    把环压扁贴合视口，中心搜索框才能稳稳待在正中。
 * 2. **环半径由容器尺寸决定，不由分类决定**——容量 `cap = floor(周长 / slot)` 自然算出。
 * 3. **容量装箱 + 分类段**——按 `category.order` 由内向外顺序装箱：
 *    一个分类可以跨环，一个环可以承载多个分类，同环不同分类各占一段连续角度扇区。
 * 4. **等弧长落位**——段内按弧长等分再反查角度，保证眼睛看到的间距真的均匀。
 *
 * ## 与设计稿的一处**有意改进**（已在交付说明中标注）
 *
 * §3.4 的伪代码把扇区跨度按**角度**比例分配（`span = usable · count / ringItemCount`）。
 * 但椭圆上「等角度 ≠ 等弧长」，靠近长轴端的扇区会拿到更短的弧长，
 * 段内项子被压得比别处密，长轴端就会重叠——这正是我们引入等弧长参数化要消灭的问题。
 *
 * 因此本实现把扇区分配也放到**弧长域**：
 *
 *     usableArc = 周长 − 段数 × gapArc
 *     每项弧长步长 step = usableArc / 本环项数     ← 全环恒定
 *     段 j 的弧长跨度 = step × count_j
 *
 * 角度扇区仍然存在（`startTheta` / `endTheta` 照常输出，接口零变化），
 * 只是它们由弧长反查得到，从而**全环间距严格相等**。
 *
 * 纯 TS：零 React、零 DOM。
 */

import {
  arcLengthAtTheta,
  getArcTable,
  minChordForArc,
  normalizeAngle,
  perimeterFactor,
  pointAt,
  thetaAtArcLength,
} from './ellipse';
import {
  ARC_SAMPLES,
  CAPACITY_MARGIN,
  CATEGORY_RING_ORDER,
  EDGE_SAFETY,
  ITEM_SIZE_STEPS,
  MIN_RINGS,
  ORBIT_BREAKPOINTS,
  ORBIT_CONFIG_BY_BP,
  RING_GAP_FACTOR,
  RING_START_BASE,
  RING_START_STAGGER,
  SLOT_STEP,
} from './orbitConstants';
import type {
  BandPlan,
  CategoryGroup,
  OrbitBreakpoint,
  OrbitConfig,
  OrbitGeometry,
  OrbitLayout,
  OrbitNode,
  OrbitRing,
  OrbitRingBase,
  OrbitSegment,
  OrbitToolInput,
  StageBox,
} from './types';

const TWO_PI = Math.PI * 2;

function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

function sum(values: readonly number[]): number {
  let acc = 0;
  for (const v of values) acc += v;
  return acc;
}

/* ─────────────────────────── 配置与几何 ─────────────────────────── */

/** 按舞台宽度判定断点 */
export function resolveBreakpoint(width: number): OrbitBreakpoint {
  if (width >= ORBIT_BREAKPOINTS.lg) return 'lg';
  if (width >= ORBIT_BREAKPOINTS.md) return 'md';
  return 'sm';
}

/** 取该舞台尺寸对应的布局配置**副本**（杜绝调用方误改常量） */
export function resolveConfig(stage: StageBox): OrbitConfig {
  const bp = resolveBreakpoint(stage.width);
  return { ...ORBIT_CONFIG_BY_BP[bp] };
}

/**
 * 按比例收小「项尺寸 + slot」，用于理想尺寸装不下时的降级重试。
 * `centerSafe*` 不参与缩放——中心搜索框的物理尺寸不会因为工具变多而变小。
 */
export function scaleConfig(cfg: OrbitConfig, scale: number): OrbitConfig {
  if (scale >= 1) return { ...cfg };
  return {
    ...cfg,
    itemW: Math.round(cfg.itemW * scale),
    itemH: Math.round(cfg.itemH * scale),
    slotIdeal: Math.round(cfg.slotIdeal * scale),
    slotMin: Math.round(cfg.slotMin * scale),
  };
}

/**
 * 由 stage + config 推导椭圆环的几何边界。
 *
 * - `k`：扁率跟随容器纵横比，钳制在 [kMin, kMax]。
 * - `rxMax`：横向、纵向都不能溢出，再扣掉 `EDGE_SAFETY` 防浮点贴边。
 * - `rx0`：不得侵入中心安全椭圆（rx、ry 两个方向都要让）。
 * - `maxRings`：**环间最小径向间距**约束。同心相似椭圆的最短距离出现在短轴两端、
 *   其值恰为 `Δry = Δrx·k`（k>1 时反过来是 `Δrx`），所以
 *   `(n-1) ≤ (rxMax - rx0)·min(1,k) / ringGapMin`，超过就必然跨环重叠。
 */
export function resolveGeometry(stage: StageBox, cfg: OrbitConfig): OrbitGeometry {
  const width = Math.max(0, stage.width);
  const height = Math.max(0, stage.height);

  const k = width > 0 ? clamp(height / width, cfg.kMin, cfg.kMax) : cfg.kMin;
  const c = perimeterFactor(k);

  const rxByWidth = (width - cfg.itemW) / 2;
  const rxByHeight = (height - cfg.itemH) / (2 * k);
  const rxMax = Math.min(rxByWidth, rxByHeight) - EDGE_SAFETY;

  if (!(rxMax > 0)) {
    return { k, c, rx0: 0, rxMax: 0, maxRings: 0 };
  }

  const rx0Raw = Math.max(cfg.centerSafeRx, cfg.centerSafeRy / k, rxMax * cfg.innerRatio);
  const rx0 = Math.min(rx0Raw, rxMax);

  const ringGapMin = Math.min(cfg.itemW, cfg.itemH) * RING_GAP_FACTOR;
  const radialSpan = (rxMax - rx0) * Math.min(1, k);
  const gapLimited = 1 + Math.floor(radialSpan / Math.max(1, ringGapMin));
  const maxRings = Math.max(1, Math.min(cfg.maxRings, gapLimited));

  return { k, c, rx0, rxMax, maxRings };
}

/** 每环起始角错位：从 12 点钟起排，每往外一环转 0.37 rad（docs §8.4） */
export function ringStartOffset(ringIndex: number): number {
  return RING_START_BASE + ringIndex * RING_START_STAGGER;
}

/** 容量计算时为分类缺口预留的周长比例（按最多 2 个缺口估） */
function gapReserveFactor(cfg: OrbitConfig): number {
  return 1 - (2 * cfg.sectorGapRad) / TWO_PI;
}

/* ───────────────────────────── 环规划 ───────────────────────────── */

/**
 * 只算半径与容量，不装箱。
 *
 * 半径在 `[rx0, rxMax]` 上**等差**分布；`ry = rx · k`；
 * 周长走 Ramanujan 闭式 `P = C(k)·rx`（线性，无需数值积分）。
 */
export function planRings(
  stage: StageBox,
  cfg: OrbitConfig,
  slot: number,
  ringCount: number,
): OrbitRingBase[] {
  const geo = resolveGeometry(stage, cfg);
  const n = Math.max(0, Math.floor(ringCount));
  if (n === 0 || geo.rxMax <= 0 || slot <= 0) return [];

  const step = n > 1 ? (geo.rxMax - geo.rx0) / (n - 1) : 0;
  const reserve = gapReserveFactor(cfg);
  const rings: OrbitRingBase[] = [];

  for (let j = 0; j < n; j += 1) {
    const rx = geo.rx0 + j * step;
    const ry = rx * geo.k;
    const perimeter = geo.c * rx;
    const capacity = Math.max(0, Math.floor((perimeter * reserve) / slot));
    rings.push({ index: j, rx, ry, perimeter, capacity });
  }

  return rings;
}

/* ─────────────────────────── 分类分组 ─────────────────────────── */

/**
 * 按 `categories.order` 分组，组内保持工具的原始声明顺序。
 * 未登记在 `CATEGORY_RING_ORDER` 里的分类按首次出现顺序追加到最外层，绝不丢工具。
 */
export function groupByCategory(tools: readonly OrbitToolInput[]): CategoryGroup[] {
  const buckets = new Map<string, string[]>();
  const extraOrder: string[] = [];

  for (const tool of tools) {
    const categoryId = tool.category || 'everyday';
    let bucket = buckets.get(categoryId);
    if (!bucket) {
      bucket = [];
      buckets.set(categoryId, bucket);
      if (!CATEGORY_RING_ORDER.includes(categoryId)) extraOrder.push(categoryId);
    }
    bucket.push(tool.id);
  }

  const ordered: CategoryGroup[] = [];
  for (const categoryId of [...CATEGORY_RING_ORDER, ...extraOrder]) {
    const toolIds = buckets.get(categoryId);
    if (toolIds && toolIds.length > 0) ordered.push({ categoryId, toolIds });
  }
  return ordered;
}

/* ─────────────────────────── 容量装箱 ─────────────────────────── */

/**
 * 最大余数法（Hamilton 配额）按容量比例给每环分配项数。
 *
 * 相比「贪心塞满内环再溢出到下一环」，比例分配让各环的**填充率一致**，
 * 视觉上不会出现「内圈挤爆、外圈空荡」，也让每环的弧长步长天然接近。
 */
function apportionCounts(caps: readonly number[], total: number): number[] {
  const n = caps.length;
  const counts = new Array<number>(n).fill(0);
  const capSum = sum(caps);
  if (n === 0 || total <= 0 || capSum <= 0) return counts;

  const remainders: { index: number; frac: number }[] = [];
  let assigned = 0;

  for (let j = 0; j < n; j += 1) {
    const quota = (total * caps[j]) / capSum;
    const base = Math.min(caps[j], Math.floor(quota));
    counts[j] = base;
    assigned += base;
    remainders.push({ index: j, frac: quota - Math.floor(quota) });
  }

  // 余量按小数部分从大到小补齐；容量已满的环跳过
  remainders.sort((a, b) => b.frac - a.frac || a.index - b.index);
  let cursor = 0;
  while (assigned < total && cursor < remainders.length) {
    const j = remainders[cursor].index;
    if (counts[j] < caps[j]) {
      counts[j] += 1;
      assigned += 1;
    }
    cursor += 1;
  }

  // 小数部分轮完仍有剩余（例如容量分布极不均），从外向内继续补
  while (assigned < total) {
    let progressed = false;
    for (let j = n - 1; j >= 0 && assigned < total; j -= 1) {
      if (counts[j] < caps[j]) {
        counts[j] += 1;
        assigned += 1;
        progressed = true;
      }
    }
    if (!progressed) break; // 全部环都满了 → 剩下的进 overflow
  }

  return counts;
}

/**
 * 「防孤儿」边界微调。
 *
 * 比例切分可能恰好把某个分类切成 `4 + 3`，尾巴太短会在外环上形成一个孤零零的小段。
 * 这里尝试把边界推到最近的分类边界上（整段前移或整段后移），
 * **前提是不撑破任一环的容量**；两种挪法都撑破就保持原样——
 * 容量是硬约束（会丢工具），孤儿只是观感问题。
 */
function fixOrphanBoundaries(
  counts: number[],
  caps: readonly number[],
  categoryOfIndex: readonly string[],
  minSegment: number,
): void {
  const n = counts.length;
  if (n < 2) return;

  for (let j = 0; j < n - 1; j += 1) {
    // 当前边界在有序列表中的下标
    let boundary = 0;
    for (let t = 0; t <= j; t += 1) boundary += counts[t];

    if (boundary <= 0 || boundary >= categoryOfIndex.length) continue;
    const cat = categoryOfIndex[boundary];
    if (categoryOfIndex[boundary - 1] !== cat) continue; // 切在分类交界上，本来就干净

    // 该分类在边界左侧（属于环 j）与右侧（进入环 j+1）各有多少项
    let left = 0;
    while (boundary - 1 - left >= 0 && categoryOfIndex[boundary - 1 - left] === cat) left += 1;
    let right = 0;
    while (boundary + right < categoryOfIndex.length && categoryOfIndex[boundary + right] === cat) {
      right += 1;
    }
    if (left >= minSegment && right >= minSegment) continue; // 两段都够长，允许跨环

    const candidates: number[] = [];
    // 后移：把左侧这 `left` 项整体推给环 j+1
    if (counts[j] - left >= 0) candidates.push(-left);
    // 前移：把右侧这 `right` 项整体拉进环 j
    candidates.push(right);
    // 挪动幅度小的优先
    candidates.sort((a, b) => Math.abs(a) - Math.abs(b));

    for (const delta of candidates) {
      const nextJ = counts[j] + delta;
      const nextJ1 = counts[j + 1] - delta;
      if (nextJ < 0 || nextJ1 < 0) continue;
      if (nextJ > caps[j] || nextJ1 > caps[j + 1]) continue;
      counts[j] = nextJ;
      counts[j + 1] = nextJ1;
      break;
    }
  }
}

/**
 * 装箱 + 角度扇区分配。
 *
 * 输出的 `ringToolIds` 是**有序列表的连续切片**，因此：
 * - 同一分类的项天然连续、绝不交错；
 * - 分类的环序天然满足 `categories.order`。
 */
export function planBands(
  rings: readonly OrbitRingBase[],
  groups: readonly CategoryGroup[],
  cfg: OrbitConfig,
): BandPlan {
  const orderedIds: string[] = [];
  const categoryOfIndex: string[] = [];
  for (const g of groups) {
    for (const id of g.toolIds) {
      orderedIds.push(id);
      categoryOfIndex.push(g.categoryId);
    }
  }

  const total = orderedIds.length;
  if (rings.length === 0) {
    return { rings: [], ringToolIds: [], overflowIds: [...orderedIds] };
  }

  const caps = rings.map((r) => r.capacity);
  const counts = apportionCounts(caps, total);
  fixOrphanBoundaries(counts, caps, categoryOfIndex, cfg.minSegment);

  // 切片
  const ringToolIds: string[][] = [];
  let cursor = 0;
  for (let j = 0; j < rings.length; j += 1) {
    const take = Math.min(counts[j], Math.max(0, total - cursor));
    ringToolIds.push(orderedIds.slice(cursor, cursor + take));
    cursor += take;
  }
  const overflowIds = orderedIds.slice(cursor);

  // 角度扇区：在**弧长域**均分，再反查角度
  const outRings: OrbitRing[] = rings.map((ring, j) => ({
    ...ring,
    segments: buildSegments(ring, ringToolIds[j], categoryOfIndex, orderedIds, cfg),
  }));

  return { rings: outRings, ringToolIds, overflowIds };
}

/** 把一环的工具 id 按分类切成连续段，并在弧长域分配跨度 */
function buildSegments(
  ring: OrbitRingBase,
  toolIds: readonly string[],
  categoryOfIndex: readonly string[],
  orderedIds: readonly string[],
  cfg: OrbitConfig,
): OrbitSegment[] {
  if (toolIds.length === 0) return [];

  // 该环内按分类聚合成连续 run（依赖切片的连续性）
  const idToCategory = new Map<string, string>();
  for (let i = 0; i < orderedIds.length; i += 1) idToCategory.set(orderedIds[i], categoryOfIndex[i]);

  const runs: { categoryId: string; count: number }[] = [];
  for (const id of toolIds) {
    const cat = idToCategory.get(id) ?? 'everyday';
    const last = runs[runs.length - 1];
    if (last && last.categoryId === cat) last.count += 1;
    else runs.push({ categoryId: cat, count: 1 });
  }

  const table = getArcTable(ring.rx, ring.ry, ARC_SAMPLES);
  if (table.total <= 0) {
    return runs.map((run) => ({
      categoryId: run.categoryId,
      count: run.count,
      startTheta: 0,
      endTheta: 0,
      startArc: 0,
      endArc: 0,
      labelAnchor: { x: 0, y: 0 },
    }));
  }

  const gapArc = (cfg.sectorGapRad / TWO_PI) * table.total;
  // 每段尾部都留一个缺口（含最后一段，缺口随即接回起点），故减 runs.length 个
  const usableArc = Math.max(0, table.total - runs.length * gapArc);
  const totalCount = toolIds.length;
  const step = usableArc / totalCount; // 全环恒定的每项弧长步长

  const startArcBase = arcLengthAtTheta(table, ringStartOffset(ring.index));
  const segments: OrbitSegment[] = [];
  let arcCursor = startArcBase;

  for (const run of runs) {
    const startArc = arcCursor;
    const endArc = startArc + step * run.count;
    const midArc = (startArc + endArc) / 2;

    const startTheta = thetaAtArcLength(table, startArc);
    const rawEnd = thetaAtArcLength(table, endArc);
    let sweep = rawEnd - startTheta;
    if (sweep <= 1e-9) sweep += TWO_PI; // 跨过 θ=0，或整环单段

    const midTheta = thetaAtArcLength(table, midArc);

    segments.push({
      categoryId: run.categoryId,
      count: run.count,
      startTheta,
      endTheta: startTheta + sweep,
      startArc,
      endArc,
      labelAnchor: pointAt(ring.rx, ring.ry, midTheta),
    });

    arcCursor = endArc + gapArc;
  }

  return segments;
}

/* ─────────────────────────── 节点落位 ─────────────────────────── */

/**
 * 段内等弧长求角 → 直角坐标。
 *
 * 每项占据 `step` 弧长，取该格的**中点**（`+0.5`）作为落位，
 * 段首尾因此各留半个步长，不会紧贴扇区缺口。
 */
export function placeNodes(
  rings: readonly OrbitRing[],
  ringToolIds: readonly string[][],
  groups: readonly CategoryGroup[],
): OrbitNode[] {
  const idToCategory = new Map<string, string>();
  for (const g of groups) {
    for (const id of g.toolIds) idToCategory.set(id, g.categoryId);
  }

  const nodes: OrbitNode[] = [];

  for (let j = 0; j < rings.length; j += 1) {
    const ring = rings[j];
    const ids = ringToolIds[j] ?? [];
    if (ids.length === 0) continue;

    const table = getArcTable(ring.rx, ring.ry, ARC_SAMPLES);
    let indexInRing = 0;
    let idCursor = 0;

    for (const seg of ring.segments) {
      const step = seg.count > 0 ? (seg.endArc - seg.startArc) / seg.count : 0;

      for (let i = 0; i < seg.count; i += 1) {
        const toolId = ids[idCursor];
        idCursor += 1;
        if (toolId === undefined) break;

        const theta = thetaAtArcLength(table, seg.startArc + step * (i + 0.5));
        const p = pointAt(ring.rx, ring.ry, theta);

        nodes.push({
          toolId,
          categoryId: idToCategory.get(toolId) ?? seg.categoryId,
          ringIndex: ring.index,
          indexInRing,
          theta: normalizeAngle(theta),
          bx: p.x,
          by: p.y,
        });
        indexInRing += 1;
      }
    }
  }

  return nodes;
}

/* ─────────────────────────── 对外入口 ─────────────────────────── */

interface FitCandidate {
  cfg: OrbitConfig;
  geo: OrbitGeometry;
  slot: number;
  plan: BandPlan;
}

/** 生成 fit-loop 要试的 slot 序列：从理想值按步长递减，并**保证包含** slotMin */
function slotLadder(cfg: OrbitConfig): number[] {
  const ladder: number[] = [];
  for (let s = cfg.slotIdeal; s > cfg.slotMin; s -= SLOT_STEP) ladder.push(s);
  ladder.push(cfg.slotMin);
  return ladder;
}

function emptyLayout(cfg: OrbitConfig, stage: StageBox, overflowIds: string[]): OrbitLayout {
  return {
    config: cfg,
    stage,
    k: clamp(stage.height / Math.max(1, stage.width), cfg.kMin, cfg.kMax),
    slot: cfg.slotIdeal,
    rings: [],
    nodes: [],
    nodeById: {},
    overflowIds,
    contentW: 0,
    contentH: 0,
  };
}

/**
 * fit-loop：**项尺寸阶梯 → slot 阶梯 → 环数**，三层由松到紧依次让步。
 *
 * 优先保住「大项 + 宽松间距 + 少环」；全都装不下时返回「最大努力」方案
 * （溢出最少的那一档），把挤出的工具记入 `overflowIds` 上报，**绝不静默丢工具**。
 */
function findFit(
  stage: StageBox,
  baseCfg: OrbitConfig,
  groups: readonly CategoryGroup[],
  total: number,
): FitCandidate | null {
  const needed = total + Math.ceil(total * CAPACITY_MARGIN);
  let fallback: FitCandidate | null = null;

  for (const scale of ITEM_SIZE_STEPS) {
    const cfg = scaleConfig(baseCfg, scale);
    const geo = resolveGeometry(stage, cfg);
    if (geo.maxRings < 1 || geo.rxMax <= 0) continue;

    const minRings = Math.min(MIN_RINGS, geo.maxRings);

    for (const slot of slotLadder(cfg)) {
      for (let n = minRings; n <= geo.maxRings; n += 1) {
        const bases = planRings(stage, cfg, slot, n);
        if (bases.length === 0) continue;
        if (sum(bases.map((r) => r.capacity)) < needed) continue;

        const plan = planBands(bases, groups, cfg);
        if (plan.overflowIds.length > 0) continue;
        if (!hasSafeSpacing(plan, cfg)) continue;

        return { cfg, geo, slot, plan };
      }
    }

    // 本尺寸档的「最大努力」方案：最多环 + 最小 slot，留作全局兜底
    const bases = planRings(stage, cfg, cfg.slotMin, geo.maxRings);
    if (bases.length === 0) continue;
    const candidate: FitCandidate = {
      cfg,
      geo,
      slot: cfg.slotMin,
      plan: planBands(bases, groups, cfg),
    };
    if (!fallback || candidate.plan.overflowIds.length < fallback.plan.overflowIds.length) {
      fallback = candidate;
    }
  }

  return fallback;
}

/** 唯一对外入口：把工具列表摆到同心椭圆环上 */
export function computeOrbitLayout(tools: readonly OrbitToolInput[], stage: StageBox): OrbitLayout {
  const baseCfg = resolveConfig(stage);
  const groups = groupByCategory(tools);
  const orderedIds = groups.flatMap((g) => g.toolIds);
  const total = orderedIds.length;

  if (total === 0 || stage.width <= 0 || stage.height <= 0) {
    return emptyLayout(baseCfg, stage, [...orderedIds]);
  }

  const chosen = findFit(stage, baseCfg, groups, total);
  if (!chosen) return emptyLayout(baseCfg, stage, [...orderedIds]);

  const nodes = placeNodes(chosen.plan.rings, chosen.plan.ringToolIds, groups);
  const nodeById: Record<string, OrbitNode> = {};
  for (const node of nodes) nodeById[node.toolId] = node;

  const usedRings = chosen.plan.rings.filter((r) => r.segments.length > 0);
  const outermost =
    usedRings[usedRings.length - 1] ?? chosen.plan.rings[chosen.plan.rings.length - 1];

  return {
    config: chosen.cfg,
    stage,
    k: chosen.geo.k,
    slot: chosen.slot,
    rings: chosen.plan.rings,
    nodes,
    nodeById,
    overflowIds: chosen.plan.overflowIds,
    contentW: outermost ? 2 * (outermost.rx + chosen.cfg.itemW / 2) : 0,
    contentH: outermost ? 2 * (outermost.ry + chosen.cfg.itemH / 2) : 0,
  };
}

/**
 * 结构性自检：同环相邻两项的**最悲观弦长**是否仍大于项的最小边长。
 *
 * 弧长间距是均匀的，但椭圆长轴端曲率大、弦长会短于弧长；
 * 这里用 `ρ_min = ry²/rx` 估出下界，不达标就让 fit-loop 继续找更宽松的方案。
 */
function hasSafeSpacing(plan: BandPlan, cfg: OrbitConfig): boolean {
  const minSep = Math.min(cfg.itemW, cfg.itemH) * RING_GAP_FACTOR;

  for (let j = 0; j < plan.rings.length; j += 1) {
    const ring = plan.rings[j];
    const count = plan.ringToolIds[j]?.length ?? 0;
    if (count < 2 || ring.segments.length === 0) continue;

    const step = (ring.segments[0].endArc - ring.segments[0].startArc) / ring.segments[0].count;
    if (!Number.isFinite(step) || step <= 0) return false;
    if (minChordForArc(ring.rx, ring.ry, step) < minSep) return false;
  }
  return true;
}
