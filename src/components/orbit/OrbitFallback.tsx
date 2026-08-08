import type { RefObject } from 'react';
import type { ToolRecord } from '@/types';
import HomeHero from '@/components/HomeHero';

export interface OrbitFallbackProps {
  /** 全部工具，透传给 HomeHero 的搜索与常用工具解析 */
  tools: ToolRecord[];
  /** 受控搜索词 */
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

/**
 * 小屏（<640px）降级视图（docs §5 Q1 方案 A）。
 *
 * 直接复用既有 `HomeHero`（首屏三句文案 + 中央搜索框 + 常用工具），零新逻辑。
 * 分类标签条与下方工具网格仍由 Home 在 orbit section 之后渲染（docs §5 Q4），
 * 因此这里只需要补回 Hero 部分即可，不重复渲染网格。
 *
 * HomeHero.tsx 本身不改（HomeHero.test.tsx 因此零风险）。
 */
export default function OrbitFallback({
  tools,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  searchInputRef,
}: OrbitFallbackProps) {
  return (
    <HomeHero
      tools={tools}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onSearchFocus={onSearchFocus}
      searchInputRef={searchInputRef}
    />
  );
}
