import React from 'react';
import GridItem from './GridItem';
import type { ToolRecord } from '@/types';
import type { GridSlot, GridTransform, ZoneId } from '@/lib/grid/types';

export interface GridZoneProps {
  tools: ToolRecord[];
  zone: ZoneId;
  slots: GridSlot[];
  transforms: Record<string, GridTransform>;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onActivate: (tool: ToolRecord) => void;
}

const ZONE_LABELS: Record<ZoneId, string> = {
  top: '日常必备',
  bottom: '图片与PDF',
  left: '理财与健康',
  right: '趣味娱乐',
};

/**
 * 单个区域组件。
 *
 * 渲染一个 zone 内的所有 GridItem。
 * 区域容器使用 relative 定位，子 GridItem absolute。
 */
export default function GridZone({
  tools,
  zone,
  slots,
  transforms,
  hoveredId,
  onHover,
  onActivate,
}: GridZoneProps) {
  const zoneSlots = slots.filter((s) => s.zone === zone);
  const zoneTools = zoneSlots
    .map((s) => tools.find((t) => t.id === s.toolId))
    .filter(Boolean) as ToolRecord[];

  if (zoneTools.length === 0) return null;

  return (
    <div className="grid-zone" data-zone={zone}>
      {/* 区域标签 */}
      <div className="grid-zone__label">
        <span>{ZONE_LABELS[zone]}</span>
        <span className="grid-zone__count">({zoneTools.length})</span>
      </div>

      {/* 工具网格 */}
      <div className="grid-zone__container">
        {zoneTools.map((tool) => {
          const slot = slots.find((s) => s.toolId === tool.id);
          if (!slot) return null;
          const transform = transforms[tool.id] || {
            dx: 0, dy: 0, scale: 1, opacity: 1, z: 1, state: 'idle' as const,
          };

          return (
            <GridItem
              key={tool.id}
              tool={tool}
              slot={slot}
              transform={transform}
              isHovered={hoveredId === tool.id}
              hasNeighborRight={slot.hasNeighborRight}
              hasNeighborBelow={slot.hasNeighborBelow}
              onHover={() => onHover(tool.id)}
              onLeave={() => onHover(null)}
              onActivate={() => onActivate(tool)}
            />
          );
        })}
      </div>
    </div>
  );
}
