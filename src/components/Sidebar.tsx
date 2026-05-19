import { useNavigate, useLocation } from 'react-router-dom';
import {
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  SparklesIcon,
  StoreIcon,
  TerminalIcon,
  ChevronRightIcon,
  WrenchIcon,
  ShieldCheckIcon,
  MessageCircleIcon,
  DollarSignIcon,
  HeartPulseIcon,
  PaintBucketIcon,
  CodeXmlIcon,
  SmileIcon,
} from 'lucide-react';
import { useStore } from '@/store';
import { categories } from '@/tools/categories';
import ThemeToggle from '@/components/ThemeToggle';

const iconMap: Record<string, React.ElementType> = {
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  SparklesIcon,
  DollarSignIcon,
  HeartPulseIcon,
  PaintBucketIcon,
  CodeXmlIcon,
  SmileIcon,
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCategory, setSelectedCategory } = useStore();

  const isHome = location.pathname === '/';
  const isMarket = location.pathname === '/market';
  const isDev = location.pathname === '/developer';
  const isCommunity = location.pathname === '/community';

  const msgCount = (() => {
    try {
      const msgs = JSON.parse(localStorage.getItem('toolbox_community_messages') || '[]');
      return Array.isArray(msgs) ? msgs.length : 0;
    } catch { return 0; }
  })();

  return (
    <aside className="w-16 hover:w-56 transition-all duration-300 bg-card border-r border-white/5 flex flex-col h-full overflow-hidden group/sidebar">
      <div className="p-4 flex items-center gap-3 border-b border-white/5 min-h-[64px]">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <WrenchIcon className="w-5 h-5 text-accent" />
        </div>
        <span className="text-white font-heading font-bold text-lg whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          日常工具箱
        </span>
      </div>

      <nav aria-label="主导航" className="flex-1 py-2 overflow-y-auto">
        <button
          onClick={() => {
            setSelectedCategory(null);
            navigate('/');
          }}
          aria-label="全部工具"
          className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
            isHome && !selectedCategory
              ? 'text-accent bg-accent/10 border-r-2 border-accent'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <ChevronRightIcon className="w-4 h-4" />
          </span>
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            全部工具
          </span>
        </button>

        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || ImageIcon;
          const isActive = selectedCategory === cat.id && isHome;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                navigate('/');
              }}
              aria-label={cat.name}
              className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? 'text-accent bg-accent/10 border-r-2 border-accent'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                {cat.name}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/5 py-2">
        <button
          onClick={() => navigate('/market')}
          aria-label="工具市场"
          className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
            isMarket
              ? 'text-accent bg-accent/10 border-r-2 border-accent'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <StoreIcon className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            工具市场
          </span>
        </button>
        <button
          onClick={() => navigate('/community')}
          aria-label="社区留言"
          className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
            isCommunity
              ? 'text-accent bg-accent/10 border-r-2 border-accent'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <MessageCircleIcon className="w-5 h-5" />
            {msgCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-bold text-white">
                {msgCount > 99 ? '99+' : msgCount}
              </span>
            )}
          </div>
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            社区留言
          </span>
        </button>
        <button
          onClick={() => navigate('/developer')}
          aria-label="开发者中心"
          className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
            isDev
              ? 'text-accent bg-accent/10 border-r-2 border-accent'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TerminalIcon className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            开发者中心
          </span>
        </button>
        <div className="px-4 py-3 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>本地优先 · 隐私保护</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
