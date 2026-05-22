import {
  SparklesIcon,
  SearchIcon,
  LayoutGridIcon,
  StarIcon,
  ClockIcon,
  PinIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { categories } from '@/tools/categories';
import ThemeToggle from '@/components/ThemeToggle';
import ToolGrid from '@/components/ToolGrid';
import OnboardingModal from '@/components/OnboardingModal';
import DonateSection from '@/components/DonateSection';

export default function Home() {
  const { tools, selectedCategory, recentToolIds, favoriteToolIds, pinnedToolIds, searchQuery } = useStore();
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding-done'));

  useEffect(() => {
    if (selectedCategory || searchQuery) {
      const timer = setTimeout(() => {
        useStore.getState().setSelectedCategory(null);
        useStore.getState().setSearchQuery('');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const filteredTools = tools.filter((tool) => {
    const matchCategory = !selectedCategory || tool.category === selectedCategory;
    const matchSearch = !searchQuery ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
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
    .filter(Boolean) as tools;

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* 顶部固定头部 */}
      <div className="flex-shrink-0 bg-bg/95 backdrop-blur-lg border-b border-white/5">
        <div className="px-4 py-3 space-y-3">
          {/* 标题行 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-accent" />
              <h1 className="text-white font-heading font-bold text-lg">普通日常工具箱</h1>
            </div>
            <ThemeToggle />
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
              placeholder="搜索工具..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => useStore.getState().setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 分类标签 - 横向滚动 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => useStore.getState().setSelectedCategory(null)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-card text-gray-400 border border-white/5 hover:text-white'
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
                      : 'bg-card text-gray-400 border border-white/5 hover:text-white'
                  }`}
                >
                  {cat.name}
                  <span className="text-gray-500">({catTools.length})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 主内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 搜索结果提示 */}
          {searchQuery && (
            <div className="text-sm text-gray-400">
              搜索 "<span className="text-white">{searchQuery}</span>" 找到 {filteredTools.length} 个工具
            </div>
          )}

          {/* 固定工具 */}
          {pinnedTools.length > 0 && !selectedCategory && !searchQuery && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PinIcon className="w-4 h-4 text-accent" />
                <h2 className="text-white font-heading font-semibold text-sm">已固定</h2>
                <span className="text-xs text-gray-500">({pinnedTools.length})</span>
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
                <h2 className="text-white font-heading font-semibold text-sm">收藏</h2>
                <span className="text-xs text-gray-500">({favoriteTools.length})</span>
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
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <h2 className="text-white font-heading font-semibold text-sm">最近</h2>
                <span className="text-xs text-gray-500">({recentTools.length})</span>
              </div>
              <div className="bg-card rounded-xl border border-white/5 p-3">
                <ToolGrid tools={recentTools.slice(0, 10)} />
              </div>
            </div>
          )}

          {/* 全部工具 - 主图标网格 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-heading font-semibold text-sm">
                {searchQuery
                  ? '搜索结果'
                  : selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name
                  : '全部工具'}
              </h2>
              <span className="text-xs text-gray-500">{filteredTools.length}</span>
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
      </div>

      {/* 新手引导 */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => {
            localStorage.setItem('onboarding-done', '1');
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
