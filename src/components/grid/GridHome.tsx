import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { ToolRecord } from '@/types';
import CommandSearch from '@/components/CommandSearch';
import GridZone from './GridZone';
import { useGridLayout } from '@/hooks/useGridLayout';
import { useGridHighlight } from '@/hooks/useGridHighlight';

export interface GridHomeProps {
  tools: ToolRecord[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

/**
 * 网格首页：CSS Grid 3×3 布局。
 *
 * ┌─────────┬─────────┬─────────┐
 * │  Top     │  Top     │  Top     │
 * ├─────────┼─────────┼─────────┤
 * │  Left    │ 🔍搜索  │  Right   │
 * ├─────────┼─────────┼─────────┤
 * │  Bottom  │  Bottom │  Bottom  │
 * └─────────┴─────────┴─────────┘
 *
 * 搜索框 getCenterCell() 返回 center cell 尺寸，传给 useGridLayout。
 * GridItem 的 cx/cy 是 zone-local 坐标。
 */
export default function GridHome({
  tools,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  searchInputRef,
}: GridHomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 用 ResizeObserver 拿容器宽（断点判定用）
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setStageW(Math.round(w / 40) * 40);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 用 window 宽兜底
  useEffect(() => {
    if (stageW > 0) return;
    setStageW(window.innerWidth);
  }, [stageW]);

  const layout = useGridLayout(tools, stageW, 0);

  const { transforms, matchCount } = useGridHighlight({
    tools,
    layout,
    query: searchQuery,
    hoveredId,
    reducedMotion: false,
  });

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleActivate = useCallback((_tool: ToolRecord) => {}, []);

  const showGrid = layout.config.breakpoint !== 'sm' && layout.slots.length > 0;

  return (
    <div className="grid-home" ref={containerRef}>
      {/* Top zone */}
      {showGrid && (
        <GridZone
          tools={tools}
          zone="top"
          slots={layout.slots}
          transforms={transforms}
          hoveredId={hoveredId}
          config={layout.config}
          onHover={handleHover}
          onActivate={handleActivate}
        />
      )}

      {/* Left zone */}
      {showGrid && (
        <GridZone
          tools={tools}
          zone="left"
          slots={layout.slots}
          transforms={transforms}
          hoveredId={hoveredId}
          config={layout.config}
          onHover={handleHover}
          onActivate={handleActivate}
        />
      )}

      {/* 搜索框：正中央 */}
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
        {searchQuery.trim() && (
          <p className="grid-home__search-count">
            搜索 "<span className="text-white">{searchQuery.trim()}</span>" 找到{' '}
            {matchCount} 个工具
          </p>
        )}
      </div>

      {/* Right zone */}
      {showGrid && (
        <GridZone
          tools={tools}
          zone="right"
          slots={layout.slots}
          transforms={transforms}
          hoveredId={hoveredId}
          config={layout.config}
          onHover={handleHover}
          onActivate={handleActivate}
        />
      )}

      {/* Bottom zone */}
      {showGrid && (
        <GridZone
          tools={tools}
          zone="bottom"
          slots={layout.slots}
          transforms={transforms}
          hoveredId={hoveredId}
          config={layout.config}
          onHover={handleHover}
          onActivate={handleActivate}
        />
      )}

      {/* sm 降级 */}
      {!showGrid && (
        <div className="grid-home__fallback">
          <span className="text-gray-500 text-sm">工具加载中...</span>
        </div>
      )}
    </div>
  );
}
