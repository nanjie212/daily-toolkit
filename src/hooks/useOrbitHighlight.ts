import { useMemo } from 'react';
import type { ToolRecord } from '@/types';
import { matchPinyin } from '@/lib/pinyinSearch';
import { computeRepulsion } from '@/lib/orbit/repulsion';
import { getRepulsionConfig } from '@/lib/orbit/orbitConstants';
import type { OrbitHighlightResult, OrbitLayout } from '@/lib/orbit/types';

/**
 * 搜索词 → 高亮集合 → 排斥位移 的 React 接入层。
 *
 * 匹配口径与 CommandSearch / Home 逐字一致（docs §8.5）：
 *   `matchPinyin(`${tool.name} ${tool.description} ${tool.id}`, query.trim())`
 * 任何一处改动，另外两处必须同步，否则会出现「下拉里有、环上不亮」。
 *
 * reducedMotion 为真时只保留高亮/变暗的视觉态，把位移清零——
 * 实现方式是在内核算完后把 dx/dy 归零，而不是关掉 enabled（关掉会连高亮态一起丢）。
 */
export function useOrbitHighlight(
  tools: readonly ToolRecord[],
  layout: OrbitLayout,
  query: string,
  reducedMotion: boolean,
): OrbitHighlightResult {
  const trimmed = query.trim();

  const highlightIds = useMemo(() => {
    const ids = new Set<string>();
    if (!trimmed) return ids;
    for (const tool of tools) {
      if (matchPinyin(`${tool.name} ${tool.description} ${tool.id}`, trimmed)) {
        ids.add(tool.id);
      }
    }
    return ids;
  }, [tools, trimmed]);

  const transforms = useMemo(() => {
    const cfg = getRepulsionConfig(layout.config.breakpoint);
    const out = computeRepulsion(layout.nodes, highlightIds, cfg);
    if (reducedMotion) {
      for (const id of Object.keys(out)) {
        out[id] = { ...out[id], dx: 0, dy: 0 };
      }
    }
    return out;
  }, [layout.nodes, layout.config.breakpoint, highlightIds, reducedMotion]);

  return {
    highlightIds,
    transforms,
    matchCount: highlightIds.size,
    isSearching: trimmed.length > 0,
  };
}
