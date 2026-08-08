/**
 * 轨道内核（src/lib/orbit）的全部类型定义。
 *
 * 设计出处：docs/system_design.md §3.1 / §3.2。
 * 本文件是纯类型模块——**零 React、零 DOM、零运行时代码**，
 * 保证整个内核可以在 vitest 的 `environment: 'node'` 下直接跑数值断言。
 *
 * 坐标系约定（docs/system_design.md §8.1，全内核统一）：
 *   - 单位一律 px；原点 = 舞台中心；`+x` 向右，`+y` **向下**（与 CSS 一致）。
 *   - 角度一律弧度；`θ = 0` 指向 3 点钟方向，θ 增大 = **顺时针**（因 y 轴向下）。
 *   - 落位公式：`bx = rx·cos θ`，`by = ry·sin θ`。
 */

/** 断点：sm = <640 降级；md = 640~1023；lg = >=1024 */
export type OrbitBreakpoint = 'sm' | 'md' | 'lg';

/** 轨道项的视觉状态，用来驱动 class 而非 style */
export type OrbitItemState = 'idle' | 'matched' | 'pushed' | 'dimmed';

/** 排斥力的距离衰减方式 */
export type FalloffKind = 'quadratic' | 'linear';

export interface Point {
  x: number;
  y: number;
}

export interface StageBox {
  /** 舞台可用宽（px，调用方应已量化到 40px 桶） */
  width: number;
  /** 舞台可用高（px，调用方应已量化到 40px 桶） */
  height: number;
}

/**
 * 布局内核对「工具」的最小输入契约。
 *
 * 刻意**不**直接依赖 `@/types` 的 `ToolRecord`：内核只需要 id 与所属分类，
 * 保持零耦合便于单测构造假数据。`ToolRecord` 结构上兼容此接口，可直接传入。
 */
export interface OrbitToolInput {
  id: string;
  category: string;
}

/** 单个断点下的布局配置，全部单位 px（除 `sectorGapRad` 为弧度） */
export interface OrbitConfig {
  breakpoint: OrbitBreakpoint;
  /** 轨道项外框宽 */
  itemW: number;
  /** 轨道项外框高 */
  itemH: number;
  /** 沿弧长的理想占位（itemW + 呼吸间隙） */
  slotIdeal: number;
  /** 装不下时允许压缩到的下限 */
  slotMin: number;
  /** 中心搜索框的安全椭圆半长轴，ring0 不得侵入 */
  centerSafeRx: number;
  /** 中心搜索框的安全椭圆半短轴，ring0 不得侵入 */
  centerSafeRy: number;
  /** ring0 半长轴相对 rxMax 的比例（与 centerSafe 取大者） */
  innerRatio: number;
  /** 环数上限 */
  maxRings: number;
  /** 一个分类被允许拆分到相邻环时，每段的最小项数（防「孤儿段」） */
  minSegment: number;
  /** 同环相邻两个分类段之间的角度缺口（弧度） */
  sectorGapRad: number;
  /** 椭圆扁率下限，k = ry/rx */
  kMin: number;
  /** 椭圆扁率上限，k = ry/rx */
  kMax: number;
}

/** 一个环上属于同一分类的连续角度扇区 */
export interface OrbitSegment {
  categoryId: string;
  /** 该段在本环上的项数 */
  count: number;
  /**
   * 段起始角（弧度）。归一化到 [0, 2π)。
   */
  startTheta: number;
  /**
   * 段结束角（弧度）。**恒 > `startTheta`**，跨过 θ=0 时会大于 2π，
   * 这样消费方（引导线 / 高亮弧）可以无脑用 `endTheta - startTheta` 当扫掠角。
   */
  endTheta: number;
  /**
   * 段起始弧长（px，沿本环累积弧长，可能大于周长——它只用于同环内做差）。
   * 这是「等弧长参数化」的第一手数据，`placeNodes` 直接消费它，
   * 避免从角度反推弧长带来的二次插值误差。
   */
  startArc: number;
  /** 段结束弧长（px），恒 > `startArc` */
  endArc: number;
  /** 分类标签锚点（段中点在椭圆上的坐标，相对舞台中心） */
  labelAnchor: Point;
}

export interface OrbitRing {
  /** 由内向外，从 0 开始 */
  index: number;
  /** 半长轴（水平） */
  rx: number;
  /** 半短轴（垂直） */
  ry: number;
  /** Ramanujan 近似周长 */
  perimeter: number;
  /** 扣除分类缺口预留后可容纳的项数 = floor(perimeter × usableFactor / slot) */
  capacity: number;
  /** 按角度顺序排列的分类段 */
  segments: OrbitSegment[];
}

/** 环的几何骨架（还没装箱，因此没有 segments） */
export type OrbitRingBase = Omit<OrbitRing, 'segments'>;

/** 单个工具在轨道上的静态落位（与搜索无关，只随尺寸变化） */
export interface OrbitNode {
  toolId: string;
  categoryId: string;
  ringIndex: number;
  /** 在本环上的序号（跨段连续递增，等于沿 θ 增大方向的次序） */
  indexInRing: number;
  /** 弧度 */
  theta: number;
  /** 基础坐标 x：相对舞台中心，px，右为正 */
  bx: number;
  /** 基础坐标 y：相对舞台中心，px，下为正 */
  by: number;
}

export interface OrbitLayout {
  config: OrbitConfig;
  stage: StageBox;
  /** 实际采用的扁率 ry/rx */
  k: number;
  /** 实际采用的弧长占位 */
  slot: number;
  rings: OrbitRing[];
  nodes: OrbitNode[];
  nodeById: Record<string, OrbitNode>;
  /** 极端窄屏下容量仍不足时被挤出的工具 id（正常应为空数组，非空需在 UI 上兜底） */
  overflowIds: string[];
  /** 舞台实际需要的内容盒宽（用于外层容器 min-width / min-height） */
  contentW: number;
  /** 舞台实际需要的内容盒高 */
  contentH: number;
}

/** 每次搜索要写到 DOM 上的视觉量，全部只影响合成层 */
export interface OrbitTransform {
  /** 排斥位移 x（px） */
  dx: number;
  /** 排斥位移 y（px） */
  dy: number;
  scale: number;
  opacity: number;
  /** z-index，恒 <= ORBIT_Z.max（20） */
  z: number;
  state: OrbitItemState;
}

export interface RepulsionConfig {
  enabled: boolean;
  /** 影响半径：超出则完全不受该高亮源影响（px） */
  radius: number;
  /** 距离趋近 0 时的峰值位移（px），钳制前的量纲 */
  strength: number;
  /** 单个节点的位移幅值上限（px） */
  maxOffset: number;
  /** 参与叠加的高亮源数量上限（取最近的 N 个） */
  maxSources: number;
  falloff: FalloffKind;
  /** 匹配项的放大倍数 */
  matchedScale: number;
  /** 未匹配项的缩小倍数 */
  dimmedScale: number;
  /** 未匹配项的透明度 */
  dimmedOpacity: number;
}

/** `useOrbitHighlight`（T02）的返回形状，内核提前定好契约 */
export interface OrbitHighlightResult {
  highlightIds: Set<string>;
  transforms: Record<string, OrbitTransform>;
  matchCount: number;
  isSearching: boolean;
}

/** 等弧长参数化用的累积弧长表 */
export interface ArcTable {
  rx: number;
  ry: number;
  /** 采样点数（θ 均匀切分的份数） */
  samples: number;
  /** 折线逼近得到的总弧长 */
  total: number;
  /** 长度 samples+1 的累积弧长，`cum[0] = 0`，`cum[samples] = total` */
  cum: Float64Array;
}

/** 按 `categories.order` 分好组的工具 id */
export interface CategoryGroup {
  categoryId: string;
  toolIds: string[];
}

/** 由 stage + config 推导出的椭圆环几何边界 */
export interface OrbitGeometry {
  /** 实际采用的扁率 ry/rx，已钳制在 [kMin, kMax] */
  k: number;
  /** Ramanujan 周长线性因子，`perimeter = c · rx` */
  c: number;
  /** 最内环半长轴 */
  rx0: number;
  /** 最外环半长轴上限（已扣掉边缘安全间距） */
  rxMax: number;
  /** 受「环间最小间距」与 `cfg.maxRings` 共同约束后的可用环数上限 */
  maxRings: number;
}

/** `planBands` 的输出 */
export interface BandPlan {
  rings: OrbitRing[];
  /** 与 rings 一一对应，每环按角度顺序排列的工具 id */
  ringToolIds: string[][];
  /** 容量不足被挤出的工具 id */
  overflowIds: string[];
}
