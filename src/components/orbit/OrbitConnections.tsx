import { memo, useMemo } from 'react';
import { ORBIT_LINES_V2 } from '@/lib/orbit/orbitConstants';
import type { OrbitNode, OrbitTransform, StageBox } from '@/lib/orbit/types';

/**
 * 卡片间细光线（v2 装饰层）—— SVG 子组件 + 纯拓扑函数。
 *
 * 设计出处：docs/orbit-v2-visual-spec.md §2.3。**纯装饰**：pointer-events:none、
 * 无 z-index（自然位于 items 之下、ring 引导线附近），不新增 z 预算。
 *
 * 拓扑规则（buildOrbitEdges，零 React 纯函数，供 node 环境单测）：
 * - 按 ringIndex 分组、环内按 indexInRing 排序；
 * - 同环下一个（首尾闭环）：node[i] → node[i+1]，最后一项回连第一项；
 * - 跳过跨分类段（skipCrossSegment 默认 true）：发送方与接收方 categoryId 不同时跳过；
 * - 跨环 spoke（crossRingSpoke 默认 false）：每节点连到 ringIndex+1 环上欧氏距离最近节点；
 * - 每条边颜色 = 发送方分类 hue（D2 默认），categoryId = from.categoryId；
 * - 环内节点数 < 2 不产生边（避免零长度自连）。
 *
 * 坐标系（docs §8.1 硬约定 #5）：SVG viewBox 以舞台中心为原点（`-w/2 -h/2 w h`），
 * `bx/by` 零转换；端点 = `bx + dx` / `by + dy`，搜索时连线跟随卡片排斥位移、不断线。
 */

export interface OrbitEdge {
  /** 唯一 key（同环边 / spoke 边各自命名空间不冲突） */
  key: string;
  from: OrbitNode;
  to: OrbitNode;
  /** 边颜色来源 = 发送方分类 id（D2 默认：分类色相） */
  categoryId: string;
}

export interface OrbitEdgesOptions {
  /** 同环下一个（首尾闭环），默认 true */
  sameRingNext?: boolean;
  /** 跳过跨分类段连线，默认 true */
  skipCrossSegment?: boolean;
  /** 跨环径向线（默认 false，feature flag 留通路） */
  crossRingSpoke?: boolean;
}

/** 纯函数：从静态落位节点推导连线边集。零 React、零 DOM。 */
export function buildOrbitEdges(
  nodes: readonly OrbitNode[],
  opts?: OrbitEdgesOptions,
): OrbitEdge[] {
  const {
    sameRingNext = true,
    skipCrossSegment = true,
    crossRingSpoke = false,
  }: OrbitEdgesOptions = opts ?? {};

  const edges: OrbitEdge[] = [];

  // 按环分组，环内保持 indexInRing 有序（输入通常已有序，这里显式排一次防依赖调用方）
  const byRing = new Map<number, OrbitNode[]>();
  for (const node of nodes) {
    const list = byRing.get(node.ringIndex);
    if (list) list.push(node);
    else byRing.set(node.ringIndex, [node]);
  }
  const ringIndexes = [...byRing.keys()].sort((a, b) => a - b);

  // 同环下一个（首尾闭环）
  if (sameRingNext) {
    for (const ringIndex of ringIndexes) {
      const list = byRing.get(ringIndex) ?? [];
      if (list.length < 2) continue; // 环内 <2 节点不产生边（避免零长度自连）
      list.sort((a, b) => a.indexInRing - b.indexInRing);
      for (let i = 0; i < list.length; i += 1) {
        const from = list[i];
        const to = list[(i + 1) % list.length];
        if (skipCrossSegment && from.categoryId !== to.categoryId) continue;
        edges.push({
          key: `ring-${ringIndex}-${from.indexInRing}-${to.indexInRing}`,
          from,
          to,
          categoryId: from.categoryId,
        });
      }
    }
  }

  // 跨环 spoke（默认关）
  if (crossRingSpoke) {
    for (let i = 0; i < ringIndexes.length - 1; i += 1) {
      const inner = byRing.get(ringIndexes[i]) ?? [];
      const outer = byRing.get(ringIndexes[i + 1]) ?? [];
      for (const from of inner) {
        let best: OrbitNode | null = null;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const to of outer) {
          const d = (from.bx - to.bx) ** 2 + (from.by - to.by) ** 2;
          if (d < bestDist) {
            bestDist = d;
            best = to;
          }
        }
        if (best) {
          edges.push({
            key: `spoke-${from.toolId}-${best.toolId}`,
            from,
            to: best,
            categoryId: from.categoryId,
          });
        }
      }
    }
  }

  return edges;
}

export interface OrbitConnectionsProps {
  /** useOrbitLayout 产出的静态落位节点 */
  nodes: readonly OrbitNode[];
  /** useOrbitHighlight 产出的视觉变换（dx/dy/state） */
  transforms: Record<string, OrbitTransform>;
  /** 量化后的舞台尺寸，viewBox 用 */
  stage: StageBox;
}

/**
 * SVG 连线层：常态 1px 细线 alpha 0.15；某工具命中时，与它相邻的连线短暂加粗发光（0.4s）。
 * 激活判定 = 任一端点 `state === 'matched'`（命中项的出边 + 前驱入边同时点亮）。
 */
function OrbitConnectionsInner({ nodes, transforms, stage }: OrbitConnectionsProps) {
  const edges = useMemo(
    () =>
      buildOrbitEdges(nodes, {
        sameRingNext: ORBIT_LINES_V2.sameRingNext,
        skipCrossSegment: ORBIT_LINES_V2.skipCrossSegment,
        crossRingSpoke: ORBIT_LINES_V2.crossRingSpoke,
      }),
    [nodes],
  );

  const w = stage.width;
  const h = stage.height;
  const colorByCategory = ORBIT_LINES_V2.colorSource === 'category';

  return (
    <svg
      className="orbit-lines"
      aria-hidden="true"
      width={w}
      height={h}
      viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
    >
      {edges.map((edge) => {
        const fromT = transforms[edge.from.toolId];
        const toT = transforms[edge.to.toolId];
        // 端点 = 静态落位 + 排斥位移 → 搜索时连线跟随卡片移动，不断线
        const x1 = edge.from.bx + (fromT?.dx ?? 0);
        const y1 = edge.from.by + (fromT?.dy ?? 0);
        const x2 = edge.to.bx + (toT?.dx ?? 0);
        const y2 = edge.to.by + (toT?.dy ?? 0);
        const active = fromT?.state === 'matched' || toT?.state === 'matched';
        const colorClass = colorByCategory
          ? ` orbit-line--cat-${edge.categoryId}`
          : ' orbit-line--accent';
        return (
          <line
            key={edge.key}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`orbit-line${colorClass}${active ? ' orbit-line--active' : ''}`}
          />
        );
      })}
    </svg>
  );
}

export default memo(OrbitConnectionsInner);
