import {
  SparklesIcon,
  LayoutGridIcon,
  StarIcon,
  ClockIcon,
  PinIcon,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import { categories } from '@/tools/categories';
import type { ToolRecord } from '@/types';
import { matchPinyin } from '@/lib/pinyinSearch';
import ThemeToggle from '@/components/ThemeToggle';
import ToolGrid from '@/components/ToolGrid';
import HomeHero from '@/components/HomeHero';
import OnboardingModal, { isOnboardingDone, markOnboardingDone } from '@/components/OnboardingModal';
import DonateSection from '@/components/DonateSection';

export default function Home() {
  const { tools, selectedCategory, recentToolIds, favoriteToolIds, pinnedToolIds, searchQuery } = useStore();
  const location = useLocation();
  // 读写统一走 safeStorage（隐私模式 / 禁用 localStorage 时不会抛错），key 见 OnboardingModal
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());
  const [scrolledLeft, setScrolledLeft] = useState(false);
  const [scrolledRight, setScrolledRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrolledLeft(el.scrollLeft > 0);
    setScrolledRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasUrlParam = params.has('category') || params.has('q');
    if ((selectedCategory || searchQuery) && !hasUrlParam) {
      const timer = setTimeout(() => {
        useStore.getState().setSelectedCategory(null);
        useStore.getState().setSearchQuery('');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    return () => el.removeEventListener('scroll', checkScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // 原生 focus 会自动把首屏搜索框滚回可视区域
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    const qParam = params.get('q');
    if (catParam) {
      useStore.getState().setSelectedCategory(catParam);
    }
    if (qParam) {
      useStore.getState().setSearchQuery(qParam);
    }
  }, [location.search]);

  const filteredTools = tools.filter((tool) => {
    const matchCategory = !selectedCategory || tool.category === selectedCategory;
    const matchSearch = !searchQuery || matchPinyin(`${tool.name} ${tool.description} ${tool.id}`, searchQuery);
    return matchCategory && matchSearch;
  });

  const recentTools = recentToolIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as typeof tools;

  const favoriteTools = favoriteToolIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as typeof tools;

  const pinnedTools = pinnedToolIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as ToolRecord[];

  const dismissOnboarding = () => {
    if (!showOnboarding) return;
    markOnboardingDone();
    setShowOnboarding(false);
  };

  return (
    // 跟随 Layout 外层滚动容器的文档流滚动，不再嵌套内部滚动区
    <div className="bg-bg">
      {/* 1. 顶部品牌条：站名小而安静，粘性常驻，右侧保留主题切换
             pr-* 用于避开固定在右上角的分享按钮（ShareButton: fixed top-4 right-4） */}
      {/* 注意：bg-bg/90 这类「CSS 变量色 + 透明度」在 Tailwind 下不会生成任何规则，
             必须用不带透明度的 bg-bg，否则粘性条会完全透明、滚动时文字互相穿透 */}
      <div className="sticky top-0 z-40 bg-bg">
        <div className="h-12 md:h-14 pl-4 pr-[72px] sm:pr-[112px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-accent" />
            <span className="text-white/80 font-heading font-medium text-[13px] md:text-sm tracking-wide">
              普通日常工具箱
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* 2~5. 首屏英雄区：大标题 → 中央搜索框 → 副标题 → 常用工具 */}
      <HomeHero
        tools={tools}
        searchQuery={searchQuery}
        onSearchChange={(value) => useStore.getState().setSearchQuery(value)}
        onSearchFocus={dismissOnboarding}
        elevated={showOnboarding}
        searchInputRef={searchRef}
      />

      {/* 分类标签 - 横向滚动（从原固定头部下移到工具列表区上方，保持粘性） */}
      <div className="sticky top-12 md:top-14 z-30 bg-bg border-y border-white/5">
        <div className="relative px-4 py-2.5">
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
          >
            <button
              onClick={() => useStore.getState().setSelectedCategory(null)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-card text-gray-300 border border-white/5 hover:text-white'
              }`}
            >
              <LayoutGridIcon className="w-4 h-4" />
              全部
            </button>
            {categories.map((cat) => {
              const catTools = tools.filter(t => t.category === cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => useStore.getState().setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-card text-gray-300 border border-white/5 hover:text-white'
                  }`}
                >
                  {cat.name}
                  <span className="text-gray-300">({catTools.length})</span>
                </button>
              );
            })}
          </div>
          <div className={`absolute right-0 top-2.5 bottom-3.5 w-10 bg-gradient-to-l from-bg to-transparent pointer-events-none transition-opacity duration-300 ${scrolledRight ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute left-0 top-2.5 bottom-3.5 w-10 bg-gradient-to-r from-bg to-transparent pointer-events-none transition-opacity duration-300 ${scrolledLeft ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="p-4 space-y-4">
        {/* 搜索结果提示 */}
        {searchQuery && (
          <div className="text-sm text-gray-300">
            搜索 "<span className="text-white">{searchQuery}</span>" 找到 {filteredTools.length} 个工具
          </div>
        )}

        {/* 固定工具 */}
        {pinnedTools.length > 0 && !selectedCategory && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PinIcon className="w-4 h-4 text-accent" />
              <h2 className="text-white font-heading font-semibold text-[15px] md:text-base">已固定</h2>
              <span className="text-xs text-gray-400">({pinnedTools.length})</span>
            </div>
            <div className="bg-card rounded-xl border border-white/5 p-3">
              <ToolGrid tools={pinnedTools} />
            </div>
          </div>
        )}

        {/* 收藏工具 */}
        {favoriteTools.length > 0 && !selectedCategory && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <StarIcon className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-heading font-semibold text-[15px] md:text-base">收藏</h2>
              <span className="text-xs text-gray-400">({favoriteTools.length})</span>
            </div>
            <div className="bg-card rounded-xl border border-white/5 p-3">
              <ToolGrid tools={favoriteTools} />
            </div>
          </div>
        )}

        {/* 最近使用 */}
        {recentTools.length > 0 && !selectedCategory && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="w-4 h-4 text-gray-300" />
              <h2 className="text-white font-heading font-semibold text-[15px] md:text-base">最近</h2>
              <span className="text-xs text-gray-400">({recentTools.length})</span>
            </div>
            <div className="bg-card rounded-xl border border-white/5 p-3">
              <ToolGrid tools={recentTools.slice(0, 10)} />
            </div>
          </div>
        )}

        {/* 全部工具 - 主图标网格 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-heading font-semibold text-[15px] md:text-base">
              {searchQuery
                ? '搜索结果'
                : selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name
                : '全部工具'}
            </h2>
            <span className="text-xs text-gray-400">{filteredTools.length}</span>
          </div>
          <div className="bg-card rounded-xl border border-white/5 p-3">
            <ToolGrid tools={filteredTools} />
          </div>
        </div>

        {/* 赞赏 */}
        {!selectedCategory && !searchQuery && (
          <div>
            <DonateSection wechatQr="" alipayQr="" />
          </div>
        )}
      </div>

      {/* 新手引导 */}
      {showOnboarding && (
        // 是否写入「已看过」标记由 OnboardingModal 内的「不再提示」勾选决定，这里只负责隐藏
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
