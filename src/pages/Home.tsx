import {
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  ArrowRightIcon,
  ClockIcon,
  StarIcon,
  SparklesIcon,
} from 'lucide-react';
import { useStore } from '@/store';
import { categories } from '@/tools/categories';
import SearchBar from '@/components/SearchBar';
import ToolCard from '@/components/ToolCard';
import ThemeToggle from '@/components/ThemeToggle';

const categoryIconMap: Record<string, React.ElementType> = {
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  SparklesIcon,
};

const categoryColors: Record<string, string> = {
  everyday: 'from-teal-500/20 to-emerald-500/20 border-teal-500/20 hover:border-teal-500/40',
  image: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20 hover:border-blue-500/40',
  text: 'from-emerald-500/20 to-green-500/20 border-emerald-500/20 hover:border-emerald-500/40',
  media: 'from-orange-500/20 to-amber-500/20 border-orange-500/20 hover:border-orange-500/40',
};

const categoryAccents: Record<string, string> = {
  everyday: 'text-teal-400',
  image: 'text-blue-400',
  text: 'text-emerald-400',
  media: 'text-orange-400',
};

export default function Home() {
  const { tools, selectedCategory, recentToolIds, favoriteToolIds, searchQuery } = useStore();

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

  const recommendedTools = tools.filter((t) =>
    ['image-compress', 'simple-calculator', 'qrcode-generator', 'password-generator', 'mortgage-calculator', 'sensitive-mask'].includes(t.id)
  );

  return (
    <div className="min-h-full p-6 lg:p-8 space-y-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center text-center py-8 space-y-6">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-accent" />
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white">
            普通日常工具箱
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-md">
          本地优先 · 隐私保护 · 无需注册
        </p>
        <SearchBar />
      </div>

      {!selectedCategory && !searchQuery && (
        <div className="animate-fade-in">
          <h2 className="text-white font-heading font-bold text-xl mb-4">工具分类</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat, index) => {
              const Icon = categoryIconMap[cat.icon] || SparklesIcon;
              return (
                <button
                  key={cat.id}
                  onClick={() => useStore.getState().setSelectedCategory(cat.id)}
                  className={`animate-fade-in group relative bg-gradient-to-br ${categoryColors[cat.id]} border rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                >
                  <Icon className={`w-8 h-8 mb-3 ${categoryAccents[cat.id]}`} />
                  <h3 className="text-white font-heading font-semibold text-sm mb-1">{cat.name}</h3>
                  <p className="text-gray-400 text-xs line-clamp-2">{cat.description}</p>
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedCategory && (
        <div className="animate-fade-in flex items-center gap-3">
          <button
            onClick={() => useStore.getState().setSelectedCategory(null)}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            全部
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-accent text-sm font-medium">
            {categories.find((c) => c.id === selectedCategory)?.name}
          </span>
        </div>
      )}

      {!selectedCategory && !searchQuery && favoriteTools.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <StarIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-heading font-bold text-xl">收藏工具</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favoriteTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        </div>
      )}

      {!selectedCategory && !searchQuery && recommendedTools.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="w-5 h-5 text-accent" />
            <h2 className="text-white font-heading font-bold text-xl">推荐工具</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {recommendedTools.map((tool, index) => (
              <div key={tool.id} className="flex-shrink-0 w-64">
                <ToolCard tool={tool} compact index={index} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedCategory && !searchQuery && recentTools.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-white font-heading font-bold text-xl">最近使用</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentTools.slice(0, 8).map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} compact index={index} />
            ))}
          </div>
        </div>
      )}

      <div className="animate-fade-in">
        <h2 className="text-white font-heading font-bold text-xl mb-4">
          {searchQuery ? '搜索结果' : selectedCategory ? '分类工具' : '全部工具'}
        </h2>
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">没有找到匹配的工具</p>
            <p className="text-sm mt-2">尝试其他关键词或分类</p>
          </div>
        )}
      </div>
    </div>
  );
}
