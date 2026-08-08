/**
 * 网格交互内核：搜索匹配/hover 时的轴向排斥与视觉态计算。
 *
 * ## 语义
 *
 * - 推开方向 = **轴向**：同排相邻卡片沿 X 轴推开，同列沿 Y 轴推开。
 * - 匹配项/hover项之间互不排斥。
 * - falloffValue 距离衰减从 orbit/repulsion.ts 复用。
 * - 纯 TS：零 React、零 DOM。
 */

import { GRID_INTERACTION_DEFAULT, GRID_Z } from './constants';
import type { FalloffKind, GridInteractionConfig, GridSlot, GridTransform } from './types';

/* ─────────────────────────── 距离衰减（从 repulsion.ts 拷贝） ─────────────────────────── */

/**
 * 距离衰减系数，返回 [0, 1]。
 *
 * `t = 1 - dist/radius`；quadratic 用 `t²`，边缘处导数为 0，收尾更柔和。
 */
export function falloffValue(dist: number, radius: number, kind: FalloffKind): number {
  if (!(radius > 0) || !Number.isFinite(dist)) return 0;
  if (dist >= radius) return 0;
  if (dist <= 0) return 1;
  const t = 1 - dist / radius;
  return kind === 'quadratic' ? t * t : t;
}

/* ─────────────────────────── 内部工具 ─────────────────────────── */

function idleTransform(): GridTransform {
  return { dx: 0, dy: 0, scale: 1, opacity: 1, z: GRID_Z.item, state: 'idle' };
}

function identityResult(slots: readonly GridSlot[]): Record<string, GridTransform> {
  const out: Record<string, GridTransform> = {};
  for (const slot of slots) out[slot.toolId] = idleTransform();
  return out;
}

/** 两个 slot 是否在同一行（同一 zone，且 row 相同） */
function sameRow(a: GridSlot, b: GridSlot): boolean {
  return a.zone === b.zone && a.row === b.row;
}

/** 两个 slot 是否在同一列（同一 zone，且 col 相同） */
function sameCol(a: GridSlot, b: GridSlot): boolean {
  return a.zone === b.zone && a.col === b.col;
}

/**
 * 计算网格排斥位移与视觉态。
 *
 * @param slots        全部网格 slot（来自 useGridLayout）
 * @param highlightIds 命中搜索的工具 id 集合（hover 时单元素集合）
 * @param hoveredId    当前 hover 的工具 id（若存在，合并到 highlightIds 逻辑）
 * @param cfg          交互参数
 */
export function computeGridInteraction(
  slots: readonly GridSlot[],
  highlightIds: ReadonlySet<string>,
  hoveredId: string | null,
  cfg: GridInteractionConfig = GRID_INTERACTION_DEFAULT,
): Record<string, GridTransform> {
  // 合并 highlight + hover 为活跃集合
  const activeIds = new Set(highlightIds);
  if (hoveredId) activeIds.add(hoveredId);

  if (!cfg.enabled || activeIds.size === 0) return identityResult(slots);

  const out: Record<string, GridTransform> = {};

  for (const slot of slots) {
    const isActive = activeIds.has(slot.toolId);
    const isHovered = slot.toolId === hoveredId;

    if (isActive) {
      // 活跃项：不位移，放大 + 提层
      out[slot.toolId] = {
        dx: 0,
        dy: 0,
        scale: isHovered ? cfg.hoverScale : cfg.matchedScale,
        opacity: 1,
        z: isHovered ? GRID_Z.hovered : GRID_Z.matched,
        state: isHovered ? 'hovered' : 'matched',
      };
      continue;
    }

    // 非活跃项：检查是否被推开
    let dx = 0;
    let dy = 0;
    let pushed = false;

    for (const srcId of activeIds) {
      const srcSlot = slots.find((s) => s.toolId === srcId);
      if (!srcSlot) continue;

      // 同排 → X 推开
      if (sameRow(slot, srcSlot)) {
        const distX = slot.cx - srcSlot.cx;
        const absDx = Math.abs(distX);
        if (absDx > 0 && absDx < cfg.pushRadius) {
          const w = cfg.pushStrength * falloffValue(absDx, cfg.pushRadius, cfg.falloff);
          const dirX = distX > 0 ? 1 : -1;
          dx += w * dirX;
        }
      }

      // 同列 → Y 推开
      if (sameCol(slot, srcSlot)) {
        const distY = slot.cy - srcSlot.cy;
        const absDy = Math.abs(distY);
        if (absDy > 0 && absDy < cfg.pushRadius) {
          const w = cfg.pushStrength * falloffValue(absDy, cfg.pushRadius, cfg.falloff);
          const dirY = distY > 0 ? 1 : -1;
          dy += w * dirY;
        }
      }
    }

    // 钳制
    if (Math.abs(dx) > cfg.maxPushX) {
      dx = Math.sign(dx) * cfg.maxPushX;
    }
    if (Math.abs(dy) > cfg.maxPushY) {
      dy = Math.sign(dy) * cfg.maxPushY;
    }

    pushed = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;

    const isDimmed = activeIds.size > 0 && !pushed;

    out[slot.toolId] = {
      dx,
      dy,
      scale: isDimmed ? cfg.dimmedScale : 1,
      opacity: isDimmed ? cfg.dimmedOpacity : 1,
      z: pushed ? GRID_Z.pushed : GRID_Z.item,
      state: pushed ? 'pushed' : (isDimmed ? 'dimmed' : 'idle'),
    };
  }

  return out;
}
