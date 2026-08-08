/**
 * useGridLayout：按断点配置计算各区工具格位（zone-local 坐标系）。
 *
 * - zone-local 坐标：cx/cy 相对所属 zone 容器左上角
 * - 邻居关系 hasNeighborRight / hasNeighborBelow 在此计算
 * - 使用 useMemo 缓存
 */

import { useMemo } from 'react';
import { assignZones } from '@/lib/grid/zoneAssigner';
import { GRID_CONFIG_BY_BP, resolveGridBreakpoint } from '@/lib/grid/constants';
import type { GridConfig, GridLayout, GridSlot } from '@/lib/grid/types';

export interface ToolInput {
  id: string;
  category: string;
}

export function useGridLayout(
  tools: readonly ToolInput[],
  stageWidth: number,
  _stageHeight: number,
): GridLayout {
  return useMemo(() => {
    const bp = resolveGridBreakpoint(stageWidth);
    const config: GridConfig = { ...GRID_CONFIG_BY_BP[bp] };

    const zones = assignZones(tools);

    if (bp === 'sm' || stageWidth <= 0) {
      return {
        config,
        stageW: stageWidth,
        stageH: 0,
        slots: [],
        slotById: {},
        zones,
      };
    }

    const { itemW, itemH, gap } = config;

    const slots: GridSlot[] = [];
    const slotById: Record<string, GridSlot> = {};

    /**
     * 把一组 toolId 排成网格，cx/cy = 卡片中心（zone-local）。
     * direction: 'row' = 横向流动（top/bottom），'col' = 纵向流动（left/right）
     */
    function layoutZone(
      toolIds: string[],
      zone: GridSlot['zone'],
      colsHint: number,
    ): void {
      if (toolIds.length === 0) return;

      // 按 colsHint 列排布
      const cols = Math.max(1, colsHint);
      let row = 0;
      let col = 0;

      for (const toolId of toolIds) {
        if (col >= cols) {
          col = 0;
          row += 1;
        }
        const cx = gap + col * (itemW + gap) + itemW / 2;
        const cy = gap + row * (itemH + gap) + itemH / 2;

        const slot: GridSlot = {
          toolId,
          categoryId: tools.find((t) => t.id === toolId)?.category ?? 'everyday',
          zone,
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
    }

    // Top zone：横向排列
    layoutZone(zones.top, 'top', Math.max(1, Math.floor((stageWidth - gap) / (itemW + gap))));

    // Bottom zone：横向排列
    layoutZone(zones.bottom, 'bottom', Math.max(1, Math.floor((stageWidth - gap) / (itemW + gap))));

    // Left/Right zone：纵向排列（2~3 列，由 sideCols 决定）
    const sideCols = config.sideCols;
    layoutZone(zones.left, 'left', sideCols);
    layoutZone(zones.right, 'right', sideCols);

    // 邻居关系
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
      stageH: 0,
      slots,
      slotById,
      zones,
    };
  // _stageHeight 当前不参与布局计算（zone-local 坐标系只依赖宽度），故不进依赖数组
  }, [tools, stageWidth]);
}
