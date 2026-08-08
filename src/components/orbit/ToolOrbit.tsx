import { useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RefObject } from 'react';
import type { ToolRecord } from '@/types';
import { useStageMetrics } from '@/hooks/useStageMetrics';
import { useOrbitLayout } from '@/hooks/useOrbitLayout';
import { useOrbitHighlight } from '@/hooks/useOrbitHighlight';
import OrbitRingsLayer from './OrbitRingsLayer';
import { OrbitItem } from './OrbitItem';
import OrbitConnections from './OrbitConnections';
import OrbitCenter from './OrbitCenter';
import {
  ENABLE_CATEGORY_LABELS,
  ENABLE_OVERFLOW_FALLBACK_ROW,
} from '@/lib/orbit/orbitConstants';

export interface ToolOrbitProps {
  tools: ToolRecord[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchFocus?: () => void;
  /** Ctrl/Cmd+K 聚焦的 input ref，透传给 OrbitCenter → CommandSearch */
  searchInputRef: RefObject<HTMLInputElement>;
  /** 分类条选中态：仅高亮该分类的圈层段（引导线/标签），不过滤 */
  activeCategoryId?: string | null;
  className?: string;
}

/**
 * 轨道视图容器：测量舞台 → 计算布局 → 计算高亮/排斥 → 渲染引导环 + 中心 + 66 个项。
 *
 * 性能红线（docs §8.6）：
 * - 只改 transform / opacity；z 轴只用在 0/1/2/6/10，硬上限 20；
 * - `will-change: transform` 只在 searchQuery !== '' 期间挂载（interacting），清空即移除；
 * - onActivate 用 useCallback 稳定引用，配合 OrbitItem 的 React.memo 逐项比对。
 */
export default function ToolOrbit({
  tools,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  searchInputRef,
  activeCategoryId = null,
  className = '',
}: ToolOrbitProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { stage, breakpoint, reducedMotion, ready } = useStageMetrics(stageRef);
  const layout = useOrbitLayout(tools, stage);
  const { transforms, matchCount, isSearching } = useOrbitHighlight(
    tools,
    layout,
    searchQuery,
    reducedMotion,
  );
  const navigate = useNavigate();

  const onActivate = useCallback(
    (toolId: string) => {
      // 与 ToolGrid 点击行为一致：跳转路由；最近使用由 ToolWorkspace 挂载时记录
      navigate(`/tool/${toolId}`);
    },
    [navigate],
  );

  const toolById = useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools]);

  const interacting = isSearching;
  const showLabels = breakpoint === 'lg' && ENABLE_CATEGORY_LABELS;

  return (
    <section
      ref={stageRef}
      role="list"
      aria-label="工具环绕视图"
      className={`orbit-stage relative w-full ${className}`}
      style={{ height: 'min(calc(100vh - 170px), 720px)', minHeight: 520 }}
    >
      {/* 键盘可达性：视觉隐藏的「跳过工具环」锚点（docs §5 Q9）。
          注意不能用 <a href="#..."> —— HashRouter 会把 hash 当路由，改成按钮聚焦目标。 */}
      <button
        type="button"
        className="sr-only"
        onClick={() => document.getElementById('orbit-skip-target')?.focus()}
      >
        跳到工具列表
      </button>

      {ready && stage.width > 0 ? (
        <>
          {/* v2 卡片间细光线层：纯装饰，pointer-events:none，位于引导环之前（z 无新增） */}
          <OrbitConnections nodes={layout.nodes} transforms={transforms} stage={stage} />
          <OrbitRingsLayer
            rings={layout.rings}
            activeCategoryId={activeCategoryId}
            showLabels={showLabels}
          >
            {layout.nodes.map((node, index) => {
              const tool = toolById.get(node.toolId);
              if (!tool) return null;
              return (
                <OrbitItem
                  key={node.toolId}
                  node={node}
                  tool={tool}
                  transform={transforms[node.toolId]}
                  itemW={layout.config.itemW}
                  itemH={layout.config.itemH}
                  enterIndex={index}
                  interacting={interacting}
                  onActivate={onActivate}
                />
              );
            })}
          </OrbitRingsLayer>

          {/* 极端窄屏的兜底行：溢出工具以紧凑胶囊列出，绝不静默丢工具 */}
          {layout.overflowIds.length > 0 && ENABLE_OVERFLOW_FALLBACK_ROW && (
            <div className="orbit-overflow" id="orbit-skip-target" tabIndex={-1}>
              <span>其余 {layout.overflowIds.length} 个工具：</span>
              {layout.overflowIds.map((id) => {
                const tool = toolById.get(id);
                if (!tool) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onActivate(id)}
                    className="orbit-overflow__chip"
                  >
                    {tool.name}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="orbit-stage__skeleton" id="orbit-skip-target" tabIndex={-1} />
      )}

      {/* 中心搜索区始终渲染（即使舞台还没测量完），保证首帧就有搜索框 */}
      <OrbitCenter
        tools={tools}
        query={searchQuery}
        matchCount={matchCount}
        onQueryChange={onSearchChange}
        onFocus={onSearchFocus}
        inputRef={searchInputRef}
        maxWidth={Math.max(320, layout.config.centerSafeRx * 2 - 40)}
      />
    </section>
  );
}
