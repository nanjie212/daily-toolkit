/**
 * 网格视图的**全部可调参数**。
 *
 * 与 `src/index.css` 的 CSS 变量成对镜像，改一处必须改另一处。
 * 纯常量模块：零 React、零 DOM。
 */

import type { GridBreakpoint, GridConfig, GridInteractionConfig } from './types';

/* ────────────────────────────── 断点 ────────────────────────────── */

/** 断点下界（px，按容器宽度判定） */
export const GRID_BREAKPOINT_MIN: Record<GridBreakpoint, number> = {
  sm: 0,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/** 各断点的布局配置 */
export const GRID_CONFIG_BY_BP: Record<GridBreakpoint, GridConfig> = {
  xl: {
    breakpoint: 'xl',
    itemW: 84,
    itemH: 76,
    gap: 6,
    searchW: 520,
    topRows: 3,
    bottomRows: 3,
    sideCols: 3,
  },
  lg: {
    breakpoint: 'lg',
    itemW: 76,
    itemH: 68,
    gap: 5,
    searchW: 440,
    topRows: 3,
    bottomRows: 2,
    sideCols: 2,
  },
  md: {
    breakpoint: 'md',
    itemW: 68,
    itemH: 60,
    gap: 4,
    searchW: 360,
    topRows: 2,
    bottomRows: 2,
    sideCols: 2,
  },
  sm: {
    breakpoint: 'sm',
    itemW: 0,   // sm 降级为 ToolGrid 列表，不使用网格引擎
    itemH: 0,
    gap: 4,
    searchW: 0,
    topRows: 0,
    bottomRows: 0,
    sideCols: 0,
  },
};

/** 按容器宽度判定断点 */
export function resolveGridBreakpoint(width: number): GridBreakpoint {
  if (width >= GRID_BREAKPOINT_MIN.xl) return 'xl';
  if (width >= GRID_BREAKPOINT_MIN.lg) return 'lg';
  if (width >= GRID_BREAKPOINT_MIN.md) return 'md';
  return 'sm';
}

/** 搜索框高度（所有断点统一，由 CommandSearch 内部 padding 决定） */
export const SEARCH_HEIGHT = 52;

/* ─────────────────────────── 四区配置 ─────────────────────────── */

/** 区域顺序（用于布局计算） */
export const ZONE_ORDER: readonly ('top' | 'left' | 'right' | 'bottom')[] = ['top', 'left', 'right', 'bottom'];

/** 分类 → 区域映射 */
export const CATEGORY_ZONE_MAP: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
  everyday: 'top',
  finance: 'left',
  health: 'left',
  image: 'bottom',
  fun: 'right',
};

/** 置顶工具 id（固定在 top 区最前两格） */
export const PINNED_TOP_TOOL_IDS: string[] = ['qr-generate', 'qr-decode'];

/* ───────────────────────────── 排斥参数 ───────────────────────────── */

export const GRID_INTERACTION_DEFAULT: GridInteractionConfig = {
  enabled: true,
  pushRadius: 160,
  pushStrength: 32,
  maxPushX: 6,
  maxPushY: 4,
  matchedScale: 1.12,
  hoverScale: 1.12,
  dimmedScale: 0.94,
  dimmedOpacity: 0.35,
  falloff: 'quadratic',
};

/* ───────────────────────────── z 轴预算 ───────────────────────────── */

export const GRID_Z = {
  item: 1,
  pushed: 2,
  hovered: 4,
  matched: 6,
  max: 10,
} as const;

/* ───────────────────────────── 动效 token ───────────────────────────── */

/**
 * 与 `src/index.css` 的 CSS 变量成对存在，改一处必须改另一处：
 *   --grid-dur-move / --grid-dur-fade / --grid-ease-move / --grid-ease-fade
 */
export const GRID_MOTION = {
  durMove: 340,
  durFade: 200,
  easeMove: 'cubic-bezier(0.34, 1.24, 0.44, 1)',
  easeFade: 'ease-out',
} as const;

/* ─────────────────────────── 分类色相（从 orbitConstants 迁移） ─────────────────────────── */

/**
 * 分类 chip 背景的 HSL 色相。
 * 与 index.css `--orbit-cat-{id}-h` 成对镜像（CSS 变量名保留不变，避免影响社区/其他页面）。
 */
export const CATEGORY_CHIP_HUE: Record<string, number> = {
  everyday: 152,
  finance: 42,
  health: 205,
  image: 265,
  fun: 330,
};

/** 分类配色渐变 class（与 ToolGrid.tsx 的 categoryColors 保持一致） */
export const CATEGORY_COLORS: Record<string, string> = {
  everyday: 'from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/40',
  finance: 'from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/40',
  health: 'from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/40',
  image: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/40',
  fun: 'from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/40',
};
