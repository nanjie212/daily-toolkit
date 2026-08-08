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
import OnboardingModal, { isOnboardingDone, markOnboardingDone } from '@/components/OnboardingModal';
import GridHome from '@/components/grid/GridHome';
import { GRID_BREAKPOINT_MIN } from '@/lib/grid/constants';

const SM_BREAKPOINT = GRID_BREAKPOINT_MIN.md; // 768

/** 视口宽度 < 768px 时为 true（小屏降级为 ToolGrid 列表）。 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(`(max-width: ${SM_BREAKPOINT - 1}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(`(max-width: ${SM_BREAKPOINT - 1}px)`);
    const handle = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  return isMobile;
}

export default function Home() {
  const { tools, selectedCategory, recentToolIds, favoriteToolIds, pinnedToolIds, searchQuery } = useStore();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());
  const [scrolledLeft, setScrolledLeft] = useState(false);
  const [scrolledRight, setScrolledRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

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
    // 初始化重置逻辑：刻意只在挂载时检查一次「从带筛选状态返回首页但 URL 无参数」
    // 的场景；把 location.search/searchQuery/selectedCategory 加入依赖会在用户后续
    // 正常搜索时误触发清空，改变既有行为。
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 判断是否显示下方内容区（非搜索/非分类筛选时显示 pinned/favorites/recent）
  const showSections = !selectedCategory && !searchQuery;

  return (
    <div className="bg-bg">
      {/* 1. 顶部品牌条：站名小而安静，粘性常驻，右侧保留主题切换
             pr-* 用于避开固定在右上角的 LeadBar 按钮组 */}
      <div className="sticky top-0 z-40 bg-bg">
        <div className="h-12 md:h-14 pl-4 pr-[200px] sm:pr-[220px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-accent" />
            <span className="text-white/80 font-heading font-medium text-[13px] md:text-sm tracking-wide">
              普通日常工具箱
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* 2. 首屏：网格布局（≥768px）/ ToolGrid 降级（<768px） */}
      {isMobile ? (
        /* 小屏降级：搜索框 + ToolGrid 列表 */
        <div className="px-4 pt-6 pb-4">
          <div className="max-w-[680px] mx-auto">
            <h1 className="font-heading font-bold text-white text-[22px] leading-tight text-center mb-4">
              一个网页，解决你的日常小问题
            </h1>
            <div className="mb-3">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
                onFocus={dismissOnboarding}
                placeholder="搜索工具，比如 二维码、房贷、图片压缩"
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-xs text-gray-400 text-center mb-6">
              无需安装，打开即用的在线实用工具集合
            </p>
          </div>

          <ToolGrid tools={filteredTools} />
        </div>
      ) : (
        /* 桌面端：网格首页（一屏不滚动）
           高度 = 100vh - 顶部品牌条，正好一屏；grid 用 height:100% 跟随，
           不再预留 180px（下方 pinned/favorites/recent 区块若存在则自然滚动出现） */
        <div className="h-[calc(100vh-48px)] md:h-[calc(100vh-56px)] overflow-hidden">
          <GridHome
            tools={tools}
            searchQuery={searchQuery}
            onSearchChange={(value) => useStore.getState().setSearchQuery(value)}
            onSearchFocus={dismissOnboarding}
            searchInputRef={searchRef}
          />
        </div>
      )}

      {/* 3. 分类标签 - 横向滚动（桌面端搜索/筛选时显示） */}
      {!isMobile && (selectedCategory || searchQuery) && (
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
      )}

      {/* 4. 下方内容：固定/收藏/最近（仅桌面端且非搜索/非筛选时显示） */}
      {!isMobile && showSections && (
        <div className="p-4 space-y-4">
          {/* 固定工具 */}
          {pinnedTools.length > 0 && (
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
          {favoriteTools.length > 0 && (
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
          {recentTools.length > 0 && (
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
        </div>
      )}

      {/* 5. 新手引导 */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
