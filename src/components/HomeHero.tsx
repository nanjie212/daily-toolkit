import type { RefObject } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ToolRecord } from '@/types';
import { COMMON_TOOL_IDS, COMMON_TOOLS_MOBILE_LIMIT } from '@/tools/commonTools';
import { getToolIcon } from '@/components/ToolGrid';
import CommandSearch from '@/components/CommandSearch';

export interface HomeHeroProps {
  /** 全部工具，用于搜索与常用工具解析 */
  tools: ToolRecord[];
  /** 受控搜索词 */
  searchQuery: string;
  /** 搜索词变化回调 */
  onSearchChange: (value: string) => void;
  /** 搜索框获得焦点时的回调（首页用于关闭新手引导） */
  onSearchFocus?: () => void;
  /** 外部持有的输入框 ref，用于 Ctrl/Cmd+K 聚焦 */
  searchInputRef: RefObject<HTMLInputElement>;
}

/**
 * 首屏英雄区。
 *
 * 视觉层级（自上而下）：
 * 1. 站名（由 Home 的顶部品牌条承担，小而安静）
 * 2. 大标题——首屏最大字号文字
 * 3. 中央搜索框——首屏最醒目的交互元素
 * 4. 副标题
 * 5. 常用工具（静态精选，胶囊按钮）
 */
export default function HomeHero({
  tools,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  searchInputRef,
}: HomeHeroProps) {
  const navigate = useNavigate();

  const commonTools = useMemo<ToolRecord[]>(() => {
    return COMMON_TOOL_IDS.map((id) => tools.find((tool) => tool.id === id)).filter(
      Boolean,
    ) as ToolRecord[];
  }, [tools]);

  return (
    <section className="relative px-4 pt-6 pb-9 md:pt-2 md:pb-14 md:min-h-[78vh] flex flex-col items-center justify-center text-center">
      {/* 2. 大标题 */}
      <h1 className="max-w-[18ch] font-heading font-bold text-white text-[26px] leading-[1.28] sm:text-4xl md:text-5xl lg:text-[54px] md:leading-[1.18] tracking-tight">
        一个网页，解决你的日常小问题
      </h1>

      {/* 3. 中央搜索框 */}
      <div className="relative w-full max-w-[680px] mt-6 md:mt-9">
        <CommandSearch
          ref={searchInputRef}
          tools={tools}
          query={searchQuery}
          onQueryChange={onSearchChange}
          onFocus={onSearchFocus}
        />
      </div>

      {/* 4. 副标题 */}
      <p className="mt-4 md:mt-5 text-[13px] md:text-[15px] text-gray-400">
        无需安装，打开即用的在线实用工具集合
      </p>

      {/* 5. 常用工具 */}
      {commonTools.length > 0 && (
        <div className="w-full max-w-[760px] mt-8 md:mt-11">
          <p className="text-[11px] md:text-xs text-gray-400 tracking-[0.2em]">常用工具</p>
          <div className="mt-3.5 flex flex-wrap justify-center gap-2 md:gap-2.5">
            {commonTools.map((tool, index) => {
              const Icon = getToolIcon(tool.icon);
              // 移动端只展示前 N 个，避免英雄区在小屏被撑得过高
              const display =
                index < COMMON_TOOLS_MOBILE_LIMIT ? 'inline-flex' : 'hidden sm:inline-flex';
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => navigate(`/tool/${tool.id}`)}
                  // 刻意不加 title={tool.description}：首屏保持安静克制，胶囊上的工具名已足够表意，
                  // 悬停再弹一层原生 tooltip 反而吵。工具描述另有 HomeHero.test.tsx 的禁用词测试兜底。
                  // hover:border-accent 不能写成 hover:border-accent/40：accent 是 CSS 变量色，带透明度的变体不会生成 CSS
                  className={`${display} group items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-white/5 text-gray-300 hover:text-white hover:border-accent hover:-translate-y-0.5 transition-all duration-200`}
                >
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-accent transition-colors" />
                  <span className="text-[13px] whitespace-nowrap">{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
