import {
  ImageIcon,
  DollarSignIcon,
  HeartPulseIcon,
  SmileIcon,
  SparklesIcon,
  StarIcon,
  ClockIcon,
  PinIcon,
  SearchIcon,
  LayoutGridIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { categories } from '@/tools/categories';
import SearchBar from '@/components/SearchBar';
import ThemeToggle from '@/components/ThemeToggle';
import ToolGrid from '@/components/ToolGrid';
import OnboardingModal from '@/components/OnboardingModal';

const categoryIconMap: Record<string, React.ElementType> = {
  ImageIcon,
  SparklesIcon,
  DollarSignIcon,
  HeartPulseIcon,
  SmileIcon,
};

const categoryColors: Record<string, string> = {
  everyday: 'from-teal-500/20 to-emerald-500/20 border-teal-500/20 hover:border-teal-500/40',
  image: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20 hover:border-blue-500/40',
  text: 'from-emerald-500/20 to-green-500/20 border-emerald-500/20 hover:border-emerald-500/40',
  media: 'from-orange-500/20 to-amber-500/20 border-orange-500/20 hover:border-orange-500/40',
  finance: 'from-amber-500/20 to-yellow-500/20 border-amber-500/20 hover:border-amber-500/40',
  health: 'from-red-500/20 to-pink-500/20 border-red-500/20 hover:border-red-500/40',
  fun: 'from-pink-500/20 to-rose-500/20 border-pink-500/20 hover:border-pink-500/40',
};

const categoryAccents: Record<string, string> = {
  everyday: 'text-teal-400',
  image: 'text-blue-400',
  text: 'text-emerald-400',
  media: 'text-orange-400',
  finance: 'text-amber-400',
  health: 'text-red-400',
  fun: 'text-pink-400',
};

export default function Home() {
  const { tools, selectedCategory, recentToolIds, favoriteToolIds, pinnedToolIds, searchQuery } = useStore();
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding-done'));

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
    .filter(Boolean) as typeof tools;

  const displayedTools = selectedCategory || searchQuery
    ? filteredTools
    : filteredTools;

  return (
    <div className="min-h-full">
      {/* 头部 */}
      <div className="sticky top-0 z-40 bg-bg/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-white font-heading font-bold text-lg">普通日常工具箱</h1>
              <p className="text-gray-500 text-xs">本地优先 · 隐私保护 · 无需注册</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
        
        {/* 搜索框 */}
        <div className="px-6 pb-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
              placeholder="搜索工具名称或描述..."
              className="w-full pl-11 pr-4 py-2.5 bg-card border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => useStore.getState().setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 分类标签 */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => useStore.getState().setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-card text-gray-400 border border-white/5 hover:text-white hover:border-white/10'
              }`}
            >
              <LayoutGridIcon className="w-4 h-4" />
              全部 ({tools.length})
            </button>
            {categories.map((cat) => {
              const Icon = categoryIconMap[cat.icon] || SparklesIcon;
              const catTools = tools.filter(t => t.category === cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => useStore.getState().setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-card text-gray-400 border border-white/5 hover:text-white hover:border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name} ({catTools.length})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {/* 搜索结果提示 */}
        {searchQuery && (
          <div className="mb-4 p-4 bg-card rounded-xl border border-white/5">
            <p className="text-gray-400 text-sm">
              搜索 "<span className="text-white">{searchQuery}</span>" 找到 {filteredTools.length} 个工具
            </p>
          </div>
        )}

        {/* 固定工具 */}
        {pinnedTools.length > 0 && !selectedCategory && !searchQuery && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <PinIcon className="w-4 h-4 text-accent" />
              <h2 className="text-white font-heading font-semibold">已固定工具</h2>
              <span className="text-xs text-gray-500">({pinnedTools.length})</span>
            </div>
            <div className="bg-card rounded-xl border border-white/5 p-4">
              <ToolGrid tools={pinnedTools} />
            </div>
          </div>
        )}

        {/* 收藏工具 */}
        {favoriteTools.length > 0 && !selectedCategory && !searchQuery && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <StarIcon className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-heading font-semibold">我的收藏</h2>
              <span className="text-xs text-gray-500">({favoriteTools.length})</span>
            </div>
            <div className="bg-card rounded-xl border border-white/5 p-4">
              <ToolGrid tools={favoriteTools} />
            </div>
          </div>
        )}

        {/* 最近使用 */}
        {recentTools.length > 0 && !selectedCategory && !searchQuery && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <h2 className="text-white font-heading font-semibold">最近使用</h2>
              <span className="text-xs text-gray-500">({recentTools.length})</span>
            </div>
            <div className="bg-card rounded-xl border border-white/5 p-4">
              <ToolGrid tools={recentTools} />
            </div>
          </div>
        )}

        {/* 全部/分类工具 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-heading font-semibold">
              {searchQuery
                ? `搜索结果`
                : selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name
                : '全部工具'}
            </h2>
            <span className="text-xs text-gray-500">{filteredTools.length} 个工具</span>
          </div>
          <div className="bg-card rounded-xl border border-white/5 p-4">
            <ToolGrid tools={displayedTools} />
          </div>
        </div>

        {/* 分类快捷入口 */}
        {!selectedCategory && !searchQuery && (
          <div className="mb-6">
            <h2 className="text-white font-heading font-semibold mb-3">快速分类</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map((cat, index) => {
                const Icon = categoryIconMap[cat.icon] || SparklesIcon;
                const catTools = tools.filter(t => t.category === cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => useStore.getState().setSelectedCategory(cat.id)}
                    className={`animate-fade-in group relative bg-gradient-to-br ${categoryColors[cat.id]} border rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                  >
                    <Icon className={`w-8 h-8 mb-3 ${categoryAccents[cat.id]}`} />
                    <h3 className="text-white font-heading font-semibold text-sm mb-1">{cat.name}</h3>
                    <p className="text-gray-400 text-xs">{catTools.length} 个工具</p>
                    <p className="text-gray-500 text-xs line-clamp-2 mt-1">{cat.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
