/**
 * useGridHighlight：搜索匹配 + hover 推开 + 视觉态计算。
 *
 * - 复用 matchPinyin 匹配口径（与 CommandSearch 同源）
 * - 调用 computeGridInteraction 计算轴向排斥
 * - 搜索中时 will-change 挂载
 */

import { useMemo } from 'react';
import { matchPinyin } from '@/lib/pinyinSearch';
import { computeGridInteraction } from '@/lib/grid/interaction';
import { GRID_INTERACTION_DEFAULT } from '@/lib/grid/constants';
import type { GridHighlightResult, GridLayout } from '@/lib/grid/types';

export interface UseGridHighlightInput {
  tools: readonly { id: string; name: string; description: string; category: string }[];
  layout: GridLayout;
  query: string;
  hoveredId: string | null;
  reducedMotion: boolean;
}

export function useGridHighlight(input: UseGridHighlightInput): GridHighlightResult {
  const { tools, layout, query, hoveredId, reducedMotion } = input;

  return useMemo(() => {
    const { slots } = layout;
    if (slots.length === 0) {
      return {
        highlightIds: new Set<string>(),
        transforms: {},
        hoveredId,
        matchCount: 0,
        isSearching: false,
      };
    }

    const trimmedQuery = query.trim();
    const isSearching = trimmedQuery.length > 0;

    // 搜索匹配（与 CommandSearch 同源口径）
    const highlightIds = new Set<string>();
    if (isSearching) {
      for (const tool of tools) {
        if (matchPinyin(`${tool.name} ${tool.description} ${tool.id}`, trimmedQuery)) {
          highlightIds.add(tool.id);
        }
      }
    }

    // 计算排斥
    const cfg = reducedMotion
      ? { ...GRID_INTERACTION_DEFAULT, enabled: false }
      : GRID_INTERACTION_DEFAULT;

    const transforms = computeGridInteraction(slots, highlightIds, hoveredId, cfg);

    return {
      highlightIds,
      transforms,
      hoveredId,
      matchCount: highlightIds.size,
      isSearching,
    };
  }, [tools, layout, query, hoveredId, reducedMotion]);
}
