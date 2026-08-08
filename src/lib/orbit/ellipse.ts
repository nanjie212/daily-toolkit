/**
 * 椭圆几何内核：周长闭式 + 等弧长参数化。
 *
 * ## 为什么需要「等弧长参数化」
 *
 * 椭圆上**等角度步进不是等距的**：
 *
 *     ds/dθ = √(rx²·sin²θ + ry²·cos²θ)
 *
 * 长轴两端（θ=0, π）该值最小 → 项子挤成一坨；短轴两端（θ=±π/2）最大 → 项子稀疏。
 * 直接按 `θ = 2πi/n` 排 66 个工具，视觉上会「两头挤、上下疏」，且长轴端必然重叠。
 *
 * 解法：对 θ∈[0, 2π) 均匀采样 720 点，用折线累加出**累积弧长表**；
 * 排项时先在**弧长域**上等分（这才是眼睛看到的「等距」），再二分反查回 θ。
 * 720 点的折线逼近相对误差约 3e-6（`θ²/24`，θ = 2π/720），完全够用；
 * 单张表 2,880 次三角运算 <1ms，且带模块级缓存，同尺寸重复布局零开销。
 *
 * ## 为什么周长用闭式而不是查表
 *
 * 装箱阶段要对「不同 slot × 不同环数」反复试算容量，如果每次都建表就太贵了。
 * Ramanujan 第二近似
 *
 *     P ≈ π[3(rx+ry) − √((3rx+ry)(rx+3ry))]
 *
 * 在 rx 上是**线性齐次**的：令 k = ry/rx，则 `P = C(k)·rx`。
 * 于是 `perimeterFactor(k)` 一次算好，环半径怎么变都只是一次乘法。
 * 该近似在 k∈[0.4, 1] 区间相对误差 < 1e-5，比我们的像素精度高好几个数量级。
 *
 * 纯 TS：零 React、零 DOM。
 */

import { ARC_SAMPLES } from './orbitConstants';
import type { ArcTable, Point } from './types';

const TWO_PI = Math.PI * 2;

/** 把任意弧度归一化到 [0, 2π) */
export function normalizeAngle(theta: number): number {
  if (!Number.isFinite(theta)) return 0;
  const t = theta % TWO_PI;
  return t < 0 ? t + TWO_PI : t;
}

/**
 * Ramanujan 周长的线性因子：`perimeter = perimeterFactor(k) · rx`，其中 `k = ry / rx`。
 *
 * 常用取值参考：k=1 → 2π≈6.283（退化为正圆，闭式精确）；k=0.53 → ≈4.92；k=0.42 → ≈4.70。
 *
 * @param k 扁率 ry/rx，必须 > 0
 */
export function perimeterFactor(k: number): number {
  if (!Number.isFinite(k) || k <= 0) return 0;
  return Math.PI * (3 * (1 + k) - Math.sqrt((3 + k) * (1 + 3 * k)));
}

/** 椭圆周长（Ramanujan 第二近似） */
export function ellipsePerimeter(rx: number, ry: number): number {
  if (!Number.isFinite(rx) || !Number.isFinite(ry) || rx <= 0 || ry <= 0) return 0;
  return perimeterFactor(ry / rx) * rx;
}

/** 椭圆上参数角 θ 处的点。`x = rx·cos θ`，`y = ry·sin θ`（y 轴向下，θ 增大即顺时针） */
export function pointAt(rx: number, ry: number, theta: number): Point {
  return { x: rx * Math.cos(theta), y: ry * Math.sin(theta) };
}

/**
 * 构建累积弧长表。
 *
 * `cum[i]` = 从 θ=0 沿顺时针走到 `θ = i·2π/samples` 的折线弧长，`cum[0] = 0`。
 *
 * @param samples θ 的均匀切分份数，默认 720（每 0.5°）
 */
export function buildArcTable(rx: number, ry: number, samples: number = ARC_SAMPLES): ArcTable {
  const n = Math.max(8, Math.floor(samples));
  const cum = new Float64Array(n + 1);

  if (!Number.isFinite(rx) || !Number.isFinite(ry) || rx <= 0 || ry <= 0) {
    return { rx, ry, samples: n, total: 0, cum };
  }

  const dTheta = TWO_PI / n;
  let prevX = rx; // θ = 0
  let prevY = 0;
  let acc = 0;

  for (let i = 1; i <= n; i += 1) {
    const theta = i * dTheta;
    const x = rx * Math.cos(theta);
    const y = ry * Math.sin(theta);
    const dx = x - prevX;
    const dy = y - prevY;
    acc += Math.sqrt(dx * dx + dy * dy);
    cum[i] = acc;
    prevX = x;
    prevY = y;
  }

  return { rx, ry, samples: n, total: acc, cum };
}

/* ───────────────────────── 模块级弧长表缓存 ─────────────────────────
 * fit-loop 会对同一组 (rx, ry) 反复求解，缓存让重复布局的建表成本归零。
 * 容量上限很小（同一时刻最多几套断点 × 几个环），超限直接整体清空即可。
 */
const ARC_TABLE_CACHE = new Map<string, ArcTable>();
const ARC_TABLE_CACHE_LIMIT = 64;

/** 带缓存的 `buildArcTable`。键按 0.001px 精度取整，避免浮点抖动导致缓存穿透。 */
export function getArcTable(rx: number, ry: number, samples: number = ARC_SAMPLES): ArcTable {
  const key = `${rx.toFixed(3)}|${ry.toFixed(3)}|${samples}`;
  const hit = ARC_TABLE_CACHE.get(key);
  if (hit) return hit;

  const table = buildArcTable(rx, ry, samples);
  if (ARC_TABLE_CACHE.size >= ARC_TABLE_CACHE_LIMIT) ARC_TABLE_CACHE.clear();
  ARC_TABLE_CACHE.set(key, table);
  return table;
}

/** 仅测试/调试用：清空弧长表缓存 */
export function clearArcTableCache(): void {
  ARC_TABLE_CACHE.clear();
}

/**
 * 弧长 → 角度（等弧长参数化的核心反查）。
 *
 * 先把 s 折回一圈之内，再在累积表上**二分**定位区间，最后线性插值。
 * 复杂度 O(log samples)，720 点即 10 次比较。
 *
 * @returns θ ∈ [0, 2π)
 */
export function thetaAtArcLength(table: ArcTable, s: number): number {
  const { total, cum, samples } = table;
  if (total <= 0 || !Number.isFinite(s)) return 0;

  // 折回 [0, total)
  let target = s % total;
  if (target < 0) target += total;

  // 二分：找最大的 lo 使 cum[lo] <= target
  let lo = 0;
  let hi = samples;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= target) lo = mid;
    else hi = mid;
  }

  const segLen = cum[lo + 1] - cum[lo];
  const frac = segLen > 1e-12 ? (target - cum[lo]) / segLen : 0;
  return ((lo + frac) * TWO_PI) / samples;
}

/**
 * 角度 → 弧长（`thetaAtArcLength` 的正向）。
 * 用于把「每环起始角」换算成起始弧长，之后所有排布都在弧长域进行。
 *
 * @returns 弧长 ∈ [0, total)
 */
export function arcLengthAtTheta(table: ArcTable, theta: number): number {
  const { total, cum, samples } = table;
  if (total <= 0) return 0;

  const t = normalizeAngle(theta);
  const pos = (t / TWO_PI) * samples;
  const i = Math.min(samples - 1, Math.floor(pos));
  const frac = pos - i;
  return cum[i] + (cum[i + 1] - cum[i]) * frac;
}

/**
 * 椭圆的最小曲率半径（出现在长轴两端）：`ρ_min = ry² / rx`（当 rx >= ry）。
 *
 * 用途：把「沿弧长的间距」换算成最悲观的**弦长**，
 * 供布局层自检「两个相邻项的直线距离是否仍大于项尺寸」。
 */
export function minCurvatureRadius(rx: number, ry: number): number {
  if (rx <= 0 || ry <= 0) return 0;
  const a = Math.max(rx, ry);
  const b = Math.min(rx, ry);
  return (b * b) / a;
}

/**
 * 给定沿弧长的间距，估算同一条椭圆上两个相邻点的**最小弦长**（最悲观值）。
 *
 * 在曲率半径 ρ 的圆弧上，弧长 s 对应的弦长为 `2ρ·sin(s / 2ρ)`；
 * 取 ρ = ρ_min 即得椭圆上的下界。
 */
export function minChordForArc(rx: number, ry: number, arc: number): number {
  const rho = minCurvatureRadius(rx, ry);
  if (rho <= 0 || arc <= 0) return 0;
  const half = arc / (2 * rho);
  // 半弧超过 π/2 时弦长不再随弧长增长，直接返回直径
  if (half >= Math.PI / 2) return 2 * rho;
  return 2 * rho * Math.sin(half);
}
