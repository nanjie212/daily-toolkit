import React, { useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';
import type { ToolRecord } from '@/types';
import CommandSearch from '@/components/CommandSearch';
import GridZone from './GridZone';
import { useStageMetrics } from '@/hooks/useStageMetrics';
import { useGridLayout } from '@/hooks/useGridLayout';
import { useGridHighlight } from '@/hooks/useGridHighlight';
import { ZONE_ORDER } from '@/lib/grid/constants';

export interface GridHomeProps {
  tools: ToolRecord[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

/**
 * 网格首页主组件。
 *
 * 组合：搜索框居中 → 四区 GridZone → Footer 统计+slogan 由外部 Layout 提供。
 *
 * 使用 useStageMetrics（复用现有 hook）获取容器尺寸，
 * 驱动 useGridLayout + useGridHighlight。
 */
export default function GridHome({
  tools,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  searchInputRef,
}: GridHomeProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const metrics = useStageMetrics(stageRef as RefObject<HTMLElement | null>);

  const layout = useGridLayout(tools, metrics.stage.width, metrics.stage.height);

  const { highlightIds, transforms, matchCount, isSearching } = useGridHighlight({
    tools,
    layout,
    query: searchQuery,
    hoveredId,
    reducedMotion: metrics.reducedMotion,
  });

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleActivate = useCallback((_tool: ToolRecord) => {
    // 点击时不做额外处理，导航由 GridItem 内部负责
  }, []);

  const showGrid = layout.config.breakpoint !== 'sm' && layout.slots.length > 0;

  return (
    <div className="grid-home" ref={stageRef}>
      {/* 搜索框居中 */}
      <div className="grid-home__search">
        <div className="grid-home__search-inner">
          <CommandSearch
            ref={searchInputRef}
            tools={tools}
            query={searchQuery}
            onQueryChange={onSearchChange}
            onFocus={onSearchFocus}
          />
        </div>
        {/* 搜索统计 */}
        {searchQuery.trim() && (
          <p className="grid-home__search-count">
            搜索 "<span className="text-white">{searchQuery.trim()}</span>" 找到{' '}
            {matchCount} 个工具
          </p>
        )}
      </div>

      {/* 四区网格 */}
      {showGrid ? (
        <div
          className={`grid-home__zones ${isSearching || hoveredId ? 'grid-home--interacting' : ''}`}
          style={{
            width: layout.stageW,
          }}
        >
          {ZONE_ORDER.map((zone) => (
            <GridZone
              key={zone}
              tools={tools}
              zone={zone}
              slots={layout.slots}
              transforms={transforms}
              hoveredId={hoveredId}
              config={layout.config}
              onHover={handleHover}
              onActivate={handleActivate}
            />
          ))}
        </div>
      ) : (
        /* sm 降级：ToolGrid 列表视图由 Home.tsx 负责 */
        <div className="grid-home__fallback">
          <span className="text-gray-500 text-sm">工具加载中...</span>
        </div>
      )}
    </div>
  );
}
