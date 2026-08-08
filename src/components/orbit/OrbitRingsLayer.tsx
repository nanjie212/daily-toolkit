import type { ReactNode } from 'react';
import type { OrbitRing } from '@/lib/orbit/types';
import { CATEGORY_LABEL, ENABLE_CATEGORY_LABELS } from '@/lib/orbit/orbitConstants';

export interface OrbitRingsLayerProps {
  /** 全部环（含每环的分类段），由 computeOrbitLayout 产出 */
  rings: OrbitRing[];
  /** 分类条选中态：仅高亮该分类的引导线 / 标签，不过滤 */
  activeCategoryId?: string | null;
  /** sm/md 下关闭分类小标签（空间紧张，见 docs §5 Q9） */
  showLabels: boolean;
  /** OrbitItem 列表（交互层；引导线与标签是 pointer-events:none 的装饰层） */
  children?: ReactNode;
}

/**
 * 轨道装饰层：椭圆引导线 + 每段分类小标签，全部 pointer-events:none；
 * 轨道项列表由 children 传入，放在可交互层（默认指针事件）。
 *
 * z 轴预算（docs §8.3）：引导线 z-0；轨道项 z 由 transform.z 决定（1/2/6）；
 * 中心搜索区 z-10。硬上限 20，绝不触碰 30/40/50。
 */
export default function OrbitRingsLayer({
  rings,
  activeCategoryId = null,
  showLabels,
  children,
}: OrbitRingsLayerProps) {
  // 只画「实际装了东西」的环，空的备用环不画引导线
  const usedRings = rings.filter((ring) => ring.segments.length > 0);

  return (
    <div className="absolute inset-0">
      {/* 装饰层：引导线 + 分类小标签 */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {usedRings.map((ring) => {
          const active =
            activeCategoryId != null &&
            ring.segments.some((seg) => seg.categoryId === activeCategoryId);
          return (
            <div
              key={ring.index}
              className={`orbit-ring-guide${active ? ' orbit-ring-guide--active' : ''}`}
              style={{ width: ring.rx * 2, height: ring.ry * 2 }}
            />
          );
        })}

        {showLabels &&
          ENABLE_CATEGORY_LABELS &&
          usedRings.flatMap((ring) =>
            ring.segments.map((seg) => (
              <span
                key={`${ring.index}-${seg.categoryId}`}
                className={`orbit-ring-label${
                  activeCategoryId === seg.categoryId ? ' orbit-ring-label--active' : ''
                }`}
                style={{
                  // 标签锚在段中点（相对舞台中心），用 transform 平移，避免 left/top 像素定位
                  transform: `translate(calc(-50% + ${seg.labelAnchor.x}px), calc(-50% + ${seg.labelAnchor.y}px))`,
                }}
              >
                {CATEGORY_LABEL[seg.categoryId] ?? seg.categoryId}
              </span>
            )),
          )}
      </div>

      {/* 交互层：轨道项 */}
      {children}
    </div>
  );
}
