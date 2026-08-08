/**
 * 四区分区逻辑：按分类把工具分配到 top/bottom/left/right 四个区。
 *
 * - everyday → Top（日常必备）
 * - finance / health → Left（理财 + 健康）
 * - image → Bottom（图片与PDF）
 * - fun → Right（趣味娱乐）
 * - QR 生成 / QR 识别 固定在 Top 区前两格
 *
 * 纯 TS：零 React、零 DOM。
 */

import { CATEGORY_ZONE_MAP, PINNED_TOP_TOOL_IDS } from './constants';
import type { ZoneAssignment, ZoneId } from './types';

/** 工具的最小输入契约 */
export interface ZoneToolInput {
  id: string;
  category: string;
}

/**
 * 将工具列表分配到四个区域。
 *
 * @param tools 全部工具列表
 * @returns ZoneAssignment，其中 pinnedTop 是置顶工具 id
 */
export function assignZones(tools: readonly ZoneToolInput[]): ZoneAssignment {
  const top: string[] = [];
  const bottom: string[] = [];
  const left: string[] = [];
  const right: string[] = [];
  const pinnedTop: string[] = [];

  // 先找出置顶工具
  const pinnedSet = new Set(PINNED_TOP_TOOL_IDS);
  for (const tool of tools) {
    if (pinnedSet.has(tool.id)) {
      pinnedTop.push(tool.id);
    }
  }

  // 按分类分配
  for (const tool of tools) {
    // 置顶工具已经在 pinnedTop 中，也在 top 区
    if (pinnedSet.has(tool.id)) {
      top.push(tool.id);
      continue;
    }

    const zone: ZoneId = CATEGORY_ZONE_MAP[tool.category] || 'top';
    switch (zone) {
      case 'top':
        top.push(tool.id);
        break;
      case 'bottom':
        bottom.push(tool.id);
        break;
      case 'left':
        left.push(tool.id);
        break;
      case 'right':
        right.push(tool.id);
        break;
    }
  }

  // 确保置顶工具在 top 数组最前面
  const topWithoutPinned = top.filter((id) => !pinnedSet.has(id));
  const topFinal = [...pinnedTop, ...topWithoutPinned];

  return { top: topFinal, bottom, left, right, pinnedTop };
}
