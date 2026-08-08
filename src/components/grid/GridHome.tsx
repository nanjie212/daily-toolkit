import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { CSSProperties, RefObject } from 'react';
import type { ToolRecord } from '@/types';
import CommandSearch from '@/components/CommandSearch';
import GridZone from './GridZone';
import { useGridLayout } from '@/hooks/useGridLayout';
import { useGridHighlight } from '@/hooks/useGridHighlight';
import { SEARCH_HEIGHT } from '@/lib/grid/constants';

export interface GridHomeProps {
  tools: ToolRecord[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

/**
 * 紧凑方阵框架：按四区实际内容尺寸算出显式 grid 轨道，
 * 让工具矩阵刚好围住中央搜索框，四周间隙均匀。
 */
interface GridFrame {
  /** grid-template-columns：侧区固定宽 + 中央弹性（搜索框居中，余量均分到两侧） */
  templateColumns: string;
  /** grid-template-rows：Top/Bottom 固定高 + 中间行 = 侧区内容高度 */
  templateRows: string;
  /** Top/Bottom 区内容比整行窄时的水平居中偏移（px） */
  topOffsetX: number;
  bottomOffsetX: number;
  /**
   * Right 区水平偏移（px）：内容宽度 = sideCols*(itemW+gap) 含前导 gap、不含末尾 gap，
   * 右区会从轨道左缘排布导致最右列贴死视口右缘；左移一个 gap，让外侧留白与 Left 区对称。
   */
  rightOffsetX: number;
  /** Left/Right 区内容比中间行矮时的垂直居中偏移（px） */
  leftOffsetY: number;
  rightOffsetY: number;
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
 * └────────┴─────────┴─────────┘
 *
 * 轨道尺寸由 GridFrame 按内容算死后经 inline style 写入（容器够大时）；
 * 容器过小则回落到 index.css 的 fr 兜底轨道（均匀收缩、边缘裁剪）。
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
  const [stageH, setStageH] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 用 ResizeObserver 拿容器尺寸（宽度定断点，高度定紧凑方阵是否放得下）
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      // 宽量化到 40px 桶（断点稳定），高向下量化到 20px 桶（偏保守，避免放不下硬塞）
      setStageW(Math.round((rect?.width ?? 0) / 40) * 40);
      setStageH(Math.floor((rect?.height ?? 0) / 20) * 20);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 用 window 尺寸兜底
  useEffect(() => {
    if (stageW > 0) return;
    setStageW(window.innerWidth);
    setStageH(window.innerHeight);
  }, [stageW]);

  const layout = useGridLayout(tools, stageW, stageH);

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

  const handleActivate = useCallback((_tool: ToolRecord) => {
    // 激活行为由 GridItem 内部自行导航，此处为接口占位
  }, []);

  const showGrid = layout.config.breakpoint !== 'sm' && layout.slots.length > 0;

  // 紧凑方阵框架：四区内容尺寸 → 显式轨道 + 区内居中偏移
  const frame = useMemo<GridFrame | null>(() => {
    if (!showGrid || stageW <= 0 || stageH <= 0) return null;
    const { itemW, itemH, gap, sideCols, searchW } = layout.config;

    // zone 内容尺寸：由 slot 最大 row/col 反推（含前导 gap、不含末尾 gap）
    let topCols = 0;
    let topRows = 0;
    let bottomCols = 0;
    let bottomRows = 0;
    let leftRows = 0;
    let rightRows = 0;
    for (const s of layout.slots) {
      if (s.zone === 'top') {
        topCols = Math.max(topCols, s.col + 1);
        topRows = Math.max(topRows, s.row + 1);
      } else if (s.zone === 'bottom') {
        bottomCols = Math.max(bottomCols, s.col + 1);
        bottomRows = Math.max(bottomRows, s.row + 1);
      } else if (s.zone === 'left') {
        leftRows = Math.max(leftRows, s.row + 1);
      } else {
        rightRows = Math.max(rightRows, s.row + 1);
      }
    }

    const topW = topCols * (itemW + gap);
    const bottomW = bottomCols * (itemW + gap);
    const topH = topRows * (itemH + gap);
    const bottomH = bottomRows * (itemH + gap);
    const leftH = leftRows * (itemH + gap);
    const rightH = rightRows * (itemH + gap);
    const sideW = sideCols * (itemW + gap);
    const midH = Math.max(leftH, rightH, SEARCH_HEIGHT + 24);

    // 容器放不下紧凑方阵时返回 null，回落 CSS 的 fr 兜底轨道
    if (stageW < sideW * 2 + searchW + 32) return null;
    if (stageH < topH + midH + bottomH) return null;

    return {
      templateColumns: `${sideW}px minmax(0, 1fr) ${sideW}px`,
      templateRows: `${topH}px ${midH}px ${bottomH}px`,
      topOffsetX: Math.max(0, Math.round((stageW - topW) / 2)),
      bottomOffsetX: Math.max(0, Math.round((stageW - bottomW) / 2)),
      rightOffsetX: -gap,
      leftOffsetY: Math.max(0, Math.round((midH - leftH) / 2)),
      rightOffsetY: Math.max(0, Math.round((midH - rightH) / 2)),
    };
  }, [showGrid, layout, stageW, stageH]);

  const frameStyle: CSSProperties | undefined = frame
    ? {
        gridTemplateColumns: frame.templateColumns,
        gridTemplateRows: frame.templateRows,
        // 三行总高不足容器时整块垂直居中（四周留白均匀）
        alignContent: 'center',
      }
    : undefined;

  return (
    <div className="grid-home" ref={containerRef} style={frameStyle}>
      {/* Top zone */}
      {showGrid && (
        <GridZone
          tools={tools}
          zone="top"
          slots={layout.slots}
          transforms={transforms}
          hoveredId={hoveredId}
          config={layout.config}
          offsetX={frame?.topOffsetX ?? 0}
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
          offsetY={frame?.leftOffsetY ?? 0}
          onHover={handleHover}
          onActivate={handleActivate}
        />
      )}

      {/* 搜索框：正中央（宽度按断点配置，保证与 frame 的中央轨道一致） */}
      <div className="grid-home__search">
        <div
          className="grid-home__search-inner"
          style={layout.config.searchW > 0 ? { maxWidth: layout.config.searchW } : undefined}
        >
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
          offsetX={frame?.rightOffsetX ?? 0}
          offsetY={frame?.rightOffsetY ?? 0}
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
          offsetX={frame?.bottomOffsetX ?? 0}
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
