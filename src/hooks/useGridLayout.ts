/**
 * useGridLayout：把 N 个工具摆到四区网格上。
 *
 * - 调用 zoneAssigner 分配四区
 * - 按断点配置计算每个工具的格位 (cx, cy)
 * - 使用 useMemo 缓存，只在 tools / stage 尺寸变化时重算
 */

import { useMemo } from 'react';
import { assignZones } from '@/lib/grid/zoneAssigner';
import { GRID_CONFIG_BY_BP, resolveGridBreakpoint, SEARCH_HEIGHT, ZONE_ORDER } from '@/lib/grid/constants';
import type { GridConfig, GridLayout, GridSlot, ZoneId } from '@/lib/grid/types';

export interface ToolInput {
  id: string;
  category: string;
}

export function useGridLayout(
  tools: readonly ToolInput[],
  stageWidth: number,
  stageHeight: number,
): GridLayout {
  return useMemo(() => {
    const bp = resolveGridBreakpoint(stageWidth);
    const config: GridConfig = { ...GRID_CONFIG_BY_BP[bp] };

    const zones = assignZones(tools);

    // sm 降级：空布局
    if (bp === 'sm' || stageWidth <= 0 || stageHeight <= 0) {
      return {
        config,
        stageW: stageWidth,
        stageH: stageHeight,
        slots: [],
        slotById: {},
        zones,
      };
    }

    const { itemW, itemH, gap, searchW, topRows, bottomRows, sideCols } = config;

    const slots: GridSlot[] = [];
    const slotById: Record<string, GridSlot> = {};

    // 搜索框高度估算（含上下间距）
    const searchAreaH = SEARCH_HEIGHT + 24; // 搜索框 + 上下margin

    // 水平方向分区：左区 | 搜索 | 右区
    const leftZoneW = sideCols * itemW + (sideCols - 1) * gap;
    const rightZoneW = sideCols * itemW + (sideCols - 1) * gap;
    // 剩余给 Top/Bottom 区的宽度
    const fullWidth = Math.max(stageWidth, leftZoneW + searchW + rightZoneW + gap * 4);
    const topBotZoneW = fullWidth;

    // Top 区最大列数
    const topCols = Math.floor((topBotZoneW + gap) / (itemW + gap));

    // 总高度：Top区 + 搜索 + (Left/Right区占位) + Bottom区
    const topZoneH = topRows * itemH + (topRows - 1) * gap;
    const bottomZoneH = bottomRows * itemH + (bottomRows - 1) * gap;
    const middleH = Math.max(
      Math.ceil(Math.max(zones.left.length, zones.right.length) / sideCols) * itemH +
        (Math.ceil(Math.max(zones.left.length, zones.right.length) / sideCols) - 1) * gap,
      searchAreaH,
    );

    const totalH = topZoneH + middleH + bottomZoneH + gap * 4;

    // 垂直居中偏移
    const offsetY = Math.max(0, (stageHeight - totalH) / 2);

    let yCursor = offsetY + gap;

    // ── Top Zone ──
    const topIds = zones.top;
    let row = 0;
    let col = 0;
    for (const toolId of topIds) {
      if (col >= topCols) {
        col = 0;
        row += 1;
      }
      const cx = gap + col * (itemW + gap) + itemW / 2;
      const cy = yCursor + row * (itemH + gap) + itemH / 2;
      const slot: GridSlot = {
        toolId,
        categoryId: tools.find((t) => t.id === toolId)?.category ?? 'everyday',
        zone: 'top',
        row,
        col,
        cx,
        cy,
        hasNeighborRight: false,
        hasNeighborBelow: false,
      };
      slots.push(slot);
      slotById[toolId] = slot;
      col += 1;
    }

    yCursor += topZoneH + gap;

    const middleStartY = yCursor;

    // ── Left Zone ──
    const leftIds = zones.left;
    let lRow = 0;
    let lCol = 0;
    for (const toolId of leftIds) {
      if (lCol >= sideCols) {
        lCol = 0;
        lRow += 1;
      }
      const cx = gap + lCol * (itemW + gap) + itemW / 2;
      const cy = middleStartY + gap + lRow * (itemH + gap) + itemH / 2;
      const slot: GridSlot = {
        toolId,
        categoryId: tools.find((t) => t.id === toolId)?.category ?? 'everyday',
        zone: 'left',
        row: lRow,
        col: lCol,
        cx,
        cy,
        hasNeighborRight: false,
        hasNeighborBelow: false,
      };
      slots.push(slot);
      slotById[toolId] = slot;
      lCol += 1;
    }

    // ── Right Zone ──
    const rightIds = zones.right;
    let rRow = 0;
    let rCol = 0;
    const rightStartX = fullWidth - rightZoneW - gap;
    for (const toolId of rightIds) {
      if (rCol >= sideCols) {
        rCol = 0;
        rRow += 1;
      }
      const cx = rightStartX + rCol * (itemW + gap) + itemW / 2;
      const cy = middleStartY + gap + rRow * (itemH + gap) + itemH / 2;
      const slot: GridSlot = {
        toolId,
        categoryId: tools.find((t) => t.id === toolId)?.category ?? 'everyday',
        zone: 'right',
        row: rRow,
        col: rCol,
        cx,
        cy,
        hasNeighborRight: false,
        hasNeighborBelow: false,
      };
      slots.push(slot);
      slotById[toolId] = slot;
      rCol += 1;
    }

    yCursor += middleH + gap;

    // ── Bottom Zone ──
    const bottomIds = zones.bottom;
    const botCols = Math.floor((topBotZoneW + gap) / (itemW + gap));
    let bRow = 0;
    let bCol = 0;
    for (const toolId of bottomIds) {
      if (bCol >= botCols) {
        bCol = 0;
        bRow += 1;
      }
      const cx = gap + bCol * (itemW + gap) + itemW / 2;
      const cy = yCursor + bRow * (itemH + gap) + itemH / 2;
      const slot: GridSlot = {
        toolId,
        categoryId: tools.find((t) => t.id === toolId)?.category ?? 'everyday',
        zone: 'bottom',
        row: bRow,
        col: bCol,
        cx,
        cy,
        hasNeighborRight: false,
        hasNeighborBelow: false,
      };
      slots.push(slot);
      slotById[toolId] = slot;
      bCol += 1;
    }

    // ── 邻居关系：同排右侧有 → hasNeighborRight；同列下方有 → hasNeighborBelow ──
    for (const slot of slots) {
      slot.hasNeighborRight = slots.some(
        (s) => s !== slot && s.zone === slot.zone && s.row === slot.row && s.col === slot.col + 1,
      );
      slot.hasNeighborBelow = slots.some(
        (s) => s !== slot && s.zone === slot.zone && s.row === slot.row + 1 && s.col === slot.col,
      );
    }

    return {
      config,
      stageW: stageWidth,
      stageH: stageHeight,
      slots,
      slotById,
      zones,
    };
  }, [tools, stageWidth, stageHeight]);
}
