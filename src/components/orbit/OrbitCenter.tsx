import type { RefObject } from 'react';
import type { ToolRecord } from '@/types';
import CommandSearch from '@/components/CommandSearch';

export interface OrbitCenterProps {
  /** 全部工具，供 CommandSearch 下拉建议使用 */
  tools: ToolRecord[];
  /** 受控搜索词 */
  query: string;
  /** 匹配到的工具数（来自 useOrbitHighlight），无输入时不渲染计数 */
  matchCount: number;
  onQueryChange: (v: string) => void;
  onFocus?: () => void;
  inputRef: RefObject<HTMLInputElement>;
  /** = centerSafeRx * 2 - 40，保证搜索框不超出中心安全椭圆 */
  maxWidth: number;
}

/**
 * 中心搜索区（docs §5 Q5）：主标题一行 → 复用 CommandSearch → 「找到 N 个工具」计数。
 *
 * 铁律（docs §8.3）：**只**在外层做定位 + z-10；CommandSearch 内部结构
 * （容器 relative 无 z-index、下拉面板 z-10）一律不碰，否则层叠 bug 会复发。
 */
export default function OrbitCenter({
  tools,
  query,
  matchCount,
  onQueryChange,
  onFocus,
  inputRef,
  maxWidth,
}: OrbitCenterProps) {
  const searching = query.trim().length > 0;

  return (
    <div className="orbit-center" style={{ width: maxWidth }}>
      <h1 className="orbit-center__title">一个网页，解决你的日常小问题</h1>

      <CommandSearch
        ref={inputRef}
        tools={tools}
        query={query}
        onQueryChange={onQueryChange}
        onFocus={onFocus}
      />

      {searching && (
        <p className="orbit-center__count" aria-live="polite">
          找到 {matchCount} 个工具
        </p>
      )}
    </div>
  );
}
