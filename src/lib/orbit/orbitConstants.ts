/**
 * 轨道视图的**全部可调参数**。
 *
 * docs/system_design.md §5 把 9 个待决策点全部收敛到了这一个文件——
 * 想改手感（排斥幅度、动画时长、项尺寸、扁率范围、是否开呼吸浮动）只需要动这里，
 * 不需要碰算法、Hook 或组件。
 *
 * 纯常量模块：零 React、零 DOM。唯一的外部依赖是 `@/tools/categories`
 * （它自身只 `import type`，是纯数据模块，node 环境可安全加载）。
 */

import { categories } from '@/tools/categories';
import type { OrbitBreakpoint, OrbitConfig, RepulsionConfig } from './types';

/* ────────────────────────────── 断点 ────────────────────────────── */

/** 断点下界（px，按容器宽度判定）。sm 段会在 T04 触发降级视图。 */
export const ORBIT_BREAKPOINTS: Record<OrbitBreakpoint, number> = {
  sm: 0,
  md: 640,
  lg: 1024,
};

/** 小于该宽度时首页整体降级为 `OrbitFallback`（docs §5 Q1 方案 A） */
export const ORBIT_FALLBACK_MAX_WIDTH = ORBIT_BREAKPOINTS.md; // 640

/** 6° —— 同环相邻分类段之间的视觉缺口，兼作分类小标签的落位空间 */
const SECTOR_GAP_RAD = (6 * Math.PI) / 180;

/**
 * 各断点的布局配置。
 *
 * 尺寸取值依据（docs §1.1）：一个轨道项要看清 2–8 个汉字，
 * 「图标在上 + 11px 标签两行在下」的最小可用尺寸约 76×62，沿弧长最小占位 ≈ 90px。
 * md / sm 按可读性下限等比收小，并放宽扁率上限以适配竖屏平板。
 */
export const ORBIT_CONFIG_BY_BP: Record<OrbitBreakpoint, OrbitConfig> = {
  lg: {
    breakpoint: 'lg',
    itemW: 76,
    itemH: 62,
    slotIdeal: 92,
    slotMin: 74,
    centerSafeRx: 240,
    centerSafeRy: 120,
    innerRatio: 0.4,
    maxRings: 5,
    minSegment: 4,
    sectorGapRad: SECTOR_GAP_RAD,
    kMin: 0.42,
    kMax: 0.78,
  },
  md: {
    breakpoint: 'md',
    itemW: 66,
    itemH: 56,
    slotIdeal: 80,
    slotMin: 64,
    centerSafeRx: 200,
    centerSafeRy: 104,
    innerRatio: 0.4,
    maxRings: 5,
    minSegment: 3,
    sectorGapRad: SECTOR_GAP_RAD,
    kMin: 0.5,
    kMax: 1.25,
  },
  sm: {
    breakpoint: 'sm',
    itemW: 58,
    itemH: 50,
    slotIdeal: 68,
    slotMin: 56,
    centerSafeRx: 148,
    centerSafeRy: 92,
    innerRatio: 0.38,
    maxRings: 5,
    minSegment: 3,
    sectorGapRad: SECTOR_GAP_RAD,
    kMin: 0.55,
    kMax: 1.9,
  },
};

/* ─────────────────────────── 布局求解参数 ─────────────────────────── */

/** 等弧长采样点数：720 点 × 数环一次性 <1ms，误差 ~3e-6，足够 */
export const ARC_SAMPLES = 720;

/** fit-loop 中 slot 每次递减的步长（px） */
export const SLOT_STEP = 4;

/** 起步环数（容量足够时不再加环，避免外圈过大） */
export const MIN_RINGS = 3;

/**
 * 容量余量：装箱时要求 `Σcapacity >= total × (1 + CAPACITY_MARGIN)`。
 * 留一点余量给「防孤儿」的边界微调，不留则边界一动就溢出。
 */
export const CAPACITY_MARGIN = 0.03;

/**
 * 环间最小径向间距 = `min(itemW, itemH) × RING_GAP_FACTOR`。
 *
 * 同心相似椭圆之间的最短距离出现在**短轴两端**，其值恰为 `Δry`，
 * 所以只要 `Δry >= 项的最小边长`，跨环就绝不会重叠。
 */
export const RING_GAP_FACTOR = 1.0;

/** 最外环到舞台边缘额外留出的安全间距（px），防浮点误差贴边 */
export const EDGE_SAFETY = 2;

/**
 * 极端尺寸下的项缩放阶梯：理想尺寸装不下时，按比例收小项与 slot 再试。
 * 1 = 原始尺寸；最小 0.76 时 lg 项为 58×47，仍能读清 11px 两行标签。
 */
export const ITEM_SIZE_STEPS: readonly number[] = [1, 0.92, 0.84, 0.76];

/**
 * 每环起始角错位（弧度）：`ringStartOffset(j) = -π/2 + j × RING_START_STAGGER`。
 * 从 12 点钟方向起排，每往外一环转一点，避免各环项子在竖直方向连成一根「柱子」。
 */
export const RING_START_BASE = -Math.PI / 2;
export const RING_START_STAGGER = 0.37;

/* ───────────────────────────── 排斥参数 ───────────────────────────── */

/** 默认排斥配置（docs §5 Q2 / Q3 的建议默认值） */
export const REPULSION_DEFAULT: RepulsionConfig = {
  enabled: true,
  radius: 190,
  strength: 46,
  maxOffset: 28,
  maxSources: 8,
  falloff: 'quadratic',
  matchedScale: 1.18,
  dimmedScale: 0.94,
  dimmedOpacity: 0.32,
};

/** 各断点的排斥配置。小屏项更小，位移幅度同步收敛，避免推出可视区。 */
export const REPULSION_BY_BP: Record<OrbitBreakpoint, RepulsionConfig> = {
  lg: { ...REPULSION_DEFAULT },
  md: { ...REPULSION_DEFAULT, radius: 168, strength: 40, maxOffset: 24 },
  sm: { ...REPULSION_DEFAULT, radius: 140, strength: 32, maxOffset: 18 },
};

/** 按断点取排斥配置，返回副本，杜绝调用方误改常量 */
export function getRepulsionConfig(breakpoint: OrbitBreakpoint): RepulsionConfig {
  return { ...(REPULSION_BY_BP[breakpoint] ?? REPULSION_DEFAULT) };
}

/* ───────────────────────────── 动效 token ───────────────────────────── */

/**
 * 与 `src/index.css` 的 CSS 变量**成对存在**，改一处必须改另一处
 * （docs §8.2）：`--orbit-dur-move` / `--orbit-dur-fade` / `--orbit-ease-move`。
 */
export const ORBIT_MOTION = {
  /** transform（位移 + 缩放）时长，ms */
  durMove: 340,
  /** opacity 时长，ms */
  durFade: 200,
  /** 轻回弹：比常见的 (0.34,1.56,0.64,1) 收敛，66 个元素同时回弹时不躁 */
  easeMove: 'cubic-bezier(0.34, 1.24, 0.44, 1)',
  easeFade: 'ease-out',
  /** 入场 stagger：`min(index × enterStagger, enterStaggerMax)` ms */
  enterStagger: 8,
  enterStaggerMax: 320,
  /** idle 呼吸浮动（默认关，见 ENABLE_IDLE_FLOAT） */
  floatDuration: 6500,
  floatAmplitude: 3,
} as const;

/* ───────────────────────────── z 轴预算 ───────────────────────────── */

/**
 * 轨道视图的 z 轴预算（docs §8.3）。**硬上限 20**。
 * 30 / 40 / 50 / 300 / 400 属于既有 sticky 条、Onboarding、ShareButton，绝不可触碰。
 */
export const ORBIT_Z = {
  rings: 0,
  item: 1,
  pushed: 2,
  matched: 6,
  center: 10,
  /** 断言用的硬上限 */
  max: 20,
} as const;

/* ─────────────────────────── 分类相关常量 ─────────────────────────── */

/** 由内向外的分类顺序，直接取自 `categories.order`（docs §8.4 / §5 Q6） */
export const CATEGORY_RING_ORDER: string[] = [...categories]
  .sort((a, b) => a.order - b.order)
  .map((c) => c.id);

/** 分类 id → 展示名，供环上分类小标签使用 */
export const CATEGORY_LABEL: Record<string, string> = categories.reduce<Record<string, string>>(
  (acc, c) => {
    acc[c.id] = c.name;
    return acc;
  },
  {},
);

/**
 * 分类配色（与 `ToolGrid.tsx` 内部的 `categoryColors` 保持一致，
 * 保证环上和下方网格视觉统一）。T02 会把 ToolGrid 的那份提升为导出后二者对齐。
 */
export const CATEGORY_COLORS: Record<string, string> = {
  everyday: 'from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/40',
  finance: 'from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/40',
  health: 'from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/40',
  image: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/40',
  fun: 'from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/40',
};

/* ───────────────────────────── 功能开关 ───────────────────────────── */

/**
 * idle 呼吸浮动（docs §5 Q8）。
 * **默认关**：66 个无限 CSS 动画会持续占用合成器（笔记本耗电、低端机掉帧）。
 * 代码通路完整保留，改这一个常量即可开启。
 */
export const ENABLE_IDLE_FLOAT = false;

/** 环上是否渲染分类小标签（sm/md 空间紧张时由组件层再关一次） */
export const ENABLE_CATEGORY_LABELS = true;

/** 是否渲染装饰性椭圆引导线 */
export const ENABLE_RING_GUIDES = true;

/** 溢出工具是否在环下方以紧凑胶囊行兜底展示（绝不静默丢工具） */
export const ENABLE_OVERFLOW_FALLBACK_ROW = true;

/* ─────────────────────── v2 装饰层参数块（仅追加，旧参数一行不动） ───────────────────────
 * 与 `src/index.css` 的 `--orbit-cat-*` / `--orbit-ring-*` / `--orbit-halo-*` /
 * `--orbit-glow-*` / `--orbit-line-*` CSS 变量**成对镜像**（docs/orbit-v2-visual-spec.md §8 硬约定 #1）。
 * 改一处必须改另一处；颜色一律走 CSS 变量，禁止硬编码 hex。
 */

/**
 * 分类 chip 背景的 HSL 色相（值 = index.css `--orbit-cat-{id}-h`，成对镜像）。
 * S / L 是共享旋钮，见 CSS `--orbit-cat-s` / `--orbit-cat-l`。
 */
export const CATEGORY_CHIP_HUE: Record<string, number> = {
  everyday: 152,
  finance: 42,
  health: 205,
  image: 265,
  fun: 330,
};

/** 是否启用分类色填充背景（false = 回到 v1 的统一 --card 灰卡片） */
export const ENABLE_CATEGORY_CHIP_BG = true;

/**
 * 高亮光晕（D1 = A：单次弹 0.5s，快进慢出）。
 * 值 = index.css `--orbit-ring-*` / `--orbit-halo-*` / `--orbit-glow-*`，成对镜像。
 */
export const ORBIT_GLOW_V2 = {
  /** 静态 ring 厚度（px） */
  ringWidth: 2,
  /** 静态 ring 不透明度（accent） */
  ringAlpha: 0.9,
  /** 静态光晕扩散半径（px） */
  haloRadius: 18,
  /** 静态光晕不透明度 */
  haloAlpha: 0.35,
  /** pop 最大扩散（px）；必须 < 排斥 maxOffset 28px，配合邻居被推开不盖住 */
  popHalo: 24,
  /** 单次弹一下时长（ms） */
  popDuration: 500,
  /** 快进慢出 */
  popEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** 方案 B（循环呼吸）周期（ms）；未启用但保留通路 */
  breathDuration: 1200,
} as const;

/**
 * 卡片间细光线（D2 = 分类色相 / D3 = 回落 / D4 = 跨环 spoke 关）。
 * 值 = index.css `--orbit-line-*`，成对镜像；拓扑开关仅供 buildOrbitEdges 消费。
 */
export const ORBIT_LINES_V2 = {
  /** 常态不透明度（stroke-opacity 承担，可动画） */
  baseAlpha: 0.15,
  /** 高亮发光不透明度 */
  activeAlpha: 0.6,
  /** 高亮加粗宽度（px） */
  activeWidth: 3,
  /** 电路连通脉冲时长（ms） */
  flashDuration: 400,
  /** reducedMotion 静态微亮不透明度 */
  settleAlpha: 0.35,
  /** 同环下一个（首尾闭环） */
  sameRingNext: true,
  /** 跳过跨分类段连线（发送方与接收方 categoryId 不同时跳过） */
  skipCrossSegment: true,
  /** 跨环径向线（默认关，feature flag 留通路） */
  crossRingSpoke: false,
  /** 色相来源：'category' = 每线取发送方分类 hue；可改 'accent' 走统一 accent */
  colorSource: 'category',
} as const;
