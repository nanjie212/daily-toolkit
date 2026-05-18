import { Search } from 'lucide-react';
import { useStore } from '@/store';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore();

  return (
    <div className="relative w-full max-w-xl" role="search">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="搜索工具..."
        aria-label="搜索工具"
        className="w-full pl-12 pr-4 py-3 bg-glass border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-300 backdrop-blur-xl"
      />
    </div>
  );
}
