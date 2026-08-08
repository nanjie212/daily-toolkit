/**
 * 网格布局（src/lib/grid）的全部类型定义。
 *
 * 坐标系约定：
 *   - 原点 = 舞台左上角；+x 向右，+y 向下（CSS 坐标系）
 *   - GridSlot.cx/cy = 卡片中心相对舞台原点的像素坐标
 *   - GridTransform.dx/dy = 排斥位移增量（叠加到 cx/cy 上）
 *
 * 纯类型模块——零 React、零 DOM、零运行时代码。
 */

/** 断点：sm = <768 降级；md = ≥768；lg = ≥1024；xl = ≥1280 */
export type GridBreakpoint = 'sm' | 'md' | 'lg' | 'xl';

/** 区域标识 */
export type ZoneId = 'top' | 'bottom' | 'left' | 'right';

/** 网格项的视觉状态 */
export type GridItemState = 'idle' | 'matched' | 'hovered' | 'pushed' | 'dimmed';

/** 排斥力的距离衰减方式 */
export type FalloffKind = 'quadratic' | 'linear';

/** 单个断点下的网格布局配置 */
export interface GridConfig {
  breakpoint: GridBreakpoint;
  /** 卡片宽度（px） */
  itemW: number;
  /** 卡片高度（px） */
  itemH: number;
  /** 卡片间距（px） */
  gap: number;
  /** 搜索框宽度（px） */
  searchW: number;
  /** Top 区行数 */
  topRows: number;
  /** Bottom 区行数 */
  bottomRows: number;
  /** Left/Right 区列数 */
  sideCols: number;
}

/** 工具在网格中的静态落位 */
export interface GridSlot {
  toolId: string;
  categoryId: string;
  zone: ZoneId;
  row: number;
  col: number;
  /** 卡片中心 x（相对舞台左上角，px） */
  cx: number;
  /** 卡片中心 y（相对舞台左上角，px） */
  cy: number;
  /** 同排右侧有相邻项（用于 ::after 水平细光线） */
  hasNeighborRight: boolean;
  /** 同列下方有相邻项（用于 ::after 垂直细光线） */
  hasNeighborBelow: boolean;
}

/** 四区分组结果 */
export interface ZoneAssignment {
  top: string[];    // toolId 列表
  bottom: string[];
  left: string[];
  right: string[];
  /** 置顶工具 id（QR 生成 / QR 识别）固定在 top 区最前 */
  pinnedTop: string[];
}

/** 网格布局完整计算结果 */
export interface GridLayout {
  config: GridConfig;
  stageW: number;
  stageH: number;
  slots: GridSlot[];
  slotById: Record<string, GridSlot>;
  zones: ZoneAssignment;
}

/** 每次搜索/hover 要写到 DOM 上的视觉量 */
export interface GridTransform {
  dx: number;
  dy: number;
  scale: number;
  opacity: number;
  z: number;
  state: GridItemState;
}

/** 交互配置参数 */
export interface GridInteractionConfig {
  enabled: boolean;
  /** 推开影响半径（px），超出不受影响 */
  pushRadius: number;
  /** 推开强度系数 */
  pushStrength: number;
  /** X 方向最大推开位移（px） */
  maxPushX: number;
  /** Y 方向最大推开位移（px） */
  maxPushY: number;
  /** 匹配项缩放 */
  matchedScale: number;
  /** hover 缩放 */
  hoverScale: number;
  /** 未激活项缩放 */
  dimmedScale: number;
  /** 未激活项透明度 */
  dimmedOpacity: number;
  falloff: FalloffKind;
}

/** useGridHighlight 的返回形状 */
export interface GridHighlightResult {
  highlightIds: Set<string>;
  transforms: Record<string, GridTransform>;
  hoveredId: string | null;
  matchCount: number;
  isSearching: boolean;
}
