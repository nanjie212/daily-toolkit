import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToolIcon } from '@/components/ToolGrid';
import type { ToolRecord } from '@/types';
import type { GridSlot, GridTransform } from '@/lib/grid/types';

export interface GridItemProps {
  tool: ToolRecord;
  slot: GridSlot;
  transform: GridTransform;
  isHovered: boolean;
  hasNeighborRight: boolean;
  hasNeighborBelow: boolean;
  /** 卡片宽度 (px)，来自 GridConfig.itemW */
  itemW: number;
  /** 卡片高度 (px)，来自 GridConfig.itemH */
  itemH: number;
  onHover: () => void;
  onLeave: () => void;
  onActivate: () => void;
}

/**
 * 单个工具卡片。
 *
 * - absolute 定位，由 slot.cx/cy + transform(dx,dy) 决定位置
 * - 图标 + 名称文字（11px 两行）
 * - hover/匹配时 scale(1.12) + 分类色边框 + 发光
 * - ::after 伪元素承载相邻细光线（水平/垂直）
 */
const GridItem = memo(function GridItem({
  tool,
  slot,
  transform,
  isHovered: _isHovered,
  hasNeighborRight,
  hasNeighborBelow,
  itemW,
  itemH,
  onHover,
  onLeave,
  onActivate,
}: GridItemProps) {
  const navigate = useNavigate();
  const Icon = getToolIcon(tool.icon);

  const { dx, dy, scale, opacity, z, state } = transform;

  const handleClick = () => {
    onActivate();
    navigate(`/tool/${tool.id}`);
  };

  // 状态 class
  const stateClass =
    state === 'matched'
      ? 'grid-item--matched'
      : state === 'hovered'
        ? 'grid-item--hovered'
        : state === 'pushed'
          ? 'grid-item--pushed'
          : state === 'dimmed'
            ? 'grid-item--dimmed'
            : '';

  // 分类 class
  const catClass = `grid-item--cat-${tool.category || 'everyday'}`;

  // 细光线 class：标记邻居关系，CSS 伪元素据此绘制
  const rayClasses = [
    hasNeighborRight ? 'grid-item--ray-right' : '',
    hasNeighborBelow ? 'grid-item--ray-below' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`grid-item ${catClass} ${stateClass} ${rayClasses}`}
      style={{
        position: 'absolute',
        left: `${slot.cx}px`,
        top: `${slot.cy}px`,
        width: `${itemW}px`,
        height: `${itemH}px`,
        transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity,
        zIndex: z,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        className="grid-item__chip"
        aria-label={tool.name}
      >
        <Icon className="grid-item__icon" />
        <span className="grid-item__name">{tool.name}</span>
      </button>
    </div>
  );
});

export default GridItem;
