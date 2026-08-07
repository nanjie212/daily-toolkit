import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, XIcon, CornerDownLeftIcon } from 'lucide-react';
import type { ToolRecord } from '@/types';
import { matchPinyin } from '@/lib/pinyinSearch';
import { getToolIcon } from '@/components/ToolGrid';

export interface CommandSearchProps {
  /** 参与搜索的全部工具 */
  tools: ToolRecord[];
  /** 受控的搜索词（来自 store.searchQuery） */
  query: string;
  /** 搜索词变化回调 */
  onQueryChange: (value: string) => void;
  /** 输入框获得焦点时的额外回调（首页用于关闭新手引导） */
  onFocus?: () => void;
  /** 下拉建议最多显示条数 */
  maxSuggestions?: number;
}

/**
 * 首屏中央搜索框。
 *
 * 特性：
 * - 大尺寸、居中，作为首屏最醒目的交互元素
 * - 输入时在下方浮出实时匹配结果（拼音 / 首字母 / 原文均可）
 * - ↑↓ 选择、Enter 直接进入工具、Esc 收起或清空、点击外部关闭
 * - 不改变外部搜索词状态的语义，因此下方工具网格仍会同步过滤
 */
const CommandSearch = forwardRef<HTMLInputElement, CommandSearchProps>(function CommandSearch(
  { tools, query, onQueryChange, onFocus, maxSuggestions = 8 },
  ref,
) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmedQuery = query.trim();

  const suggestions = useMemo<ToolRecord[]>(() => {
    if (!trimmedQuery) return [];
    return tools
      .filter((tool) => matchPinyin(`${tool.name} ${tool.description} ${tool.id}`, trimmedQuery))
      .slice(0, maxSuggestions);
  }, [tools, trimmedQuery, maxSuggestions]);

  // 搜索词变化时重置高亮项；清空搜索词时收起下拉
  useEffect(() => {
    setActiveIndex(0);
    if (!trimmedQuery) setOpen(false);
  }, [trimmedQuery]);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  const openTool = (tool: ToolRecord) => {
    setOpen(false);
    navigate(`/tool/${tool.id}`);
  };

  const handleChange = (value: string) => {
    onQueryChange(value);
    setOpen(value.trim().length > 0);
  };

  const handleClear = () => {
    onQueryChange('');
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (open) {
        setOpen(false);
      } else if (query) {
        onQueryChange('');
      }
      return;
    }

    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === 'Enter') {
      const target = suggestions[activeIndex] || suggestions[0];
      if (target) {
        event.preventDefault();
        openTool(target);
      }
    }
  };

  const showPanel = open && trimmedQuery.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 搜索框主体
          注意：accent 是 CSS 变量色，Tailwind 无法为它生成 /透明度 变体（如 border-accent/60 不会产出任何 CSS），
          所以这里一律使用不带透明度的 border-accent，配合项目自带的 .shadow-glow（深浅色各有一套）做柔和光晕。 */}
      <div
        className={`flex items-center rounded-2xl bg-card border transition-all duration-200 ${
          focused ? 'border-accent shadow-glow' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <SearchIcon
          className={`flex-shrink-0 ml-4 md:ml-5 w-5 h-5 transition-colors ${
            focused ? 'text-accent' : 'text-gray-400'
          }`}
        />
        <input
          ref={ref}
          type="text"
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            setFocused(true);
            if (trimmedQuery) setOpen(true);
            onFocus?.();
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="搜索工具，比如 二维码、房贷、图片压缩"
          aria-label="搜索工具"
          role="combobox"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          aria-controls="command-search-listbox"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent px-3 py-4 md:py-5 text-white text-base md:text-[17px] placeholder-gray-500 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="清空搜索"
            className="flex-shrink-0 mr-3 md:mr-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        ) : (
          <span className="hidden md:flex flex-shrink-0 mr-4 items-center gap-1 px-2 py-1 rounded-md border border-white/10 text-[11px] text-gray-400">
            Ctrl K
          </span>
        )}
      </div>

      {/* 实时匹配结果 */}
      {showPanel && (
        <div
          id="command-search-listbox"
          role="listbox"
          aria-label="搜索建议"
          className="absolute left-0 right-0 top-[calc(100%+10px)] z-10 rounded-2xl bg-card border border-white/10 shadow-xl shadow-black/20 overflow-hidden text-left animate-fade-in"
        >
          {suggestions.length > 0 ? (
            <>
              <div className="py-1.5">
                {suggestions.map((tool, index) => {
                  const Icon = getToolIcon(tool.icon);
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openTool(tool)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* 高亮项左侧的安静指示条 */}
                      <span
                        className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-colors ${
                          isActive ? 'bg-accent' : 'bg-transparent'
                        }`}
                      />
                      <span
                        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isActive ? 'bg-white/20' : 'bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-gray-400'}`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-white truncate">{tool.name}</span>
                        <span className="block text-xs text-gray-400 truncate">
                          {tool.description}
                        </span>
                      </span>
                      {isActive && (
                        <CornerDownLeftIcon className="hidden sm:block flex-shrink-0 w-3.5 h-3.5 text-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="hidden sm:flex items-center gap-4 px-3.5 py-2 border-t border-white/5 text-[11px] text-gray-400">
                <span>↑↓ 选择</span>
                <span>Enter 打开</span>
                <span>Esc 收起</span>
              </div>
            </>
          ) : (
            <div className="px-4 py-7 text-center">
              <p className="text-sm text-gray-400">没有找到相关工具</p>
              <p className="mt-1.5 text-xs text-gray-400">
                换个说法试试，比如「压缩」「利息」「倒计时」
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default CommandSearch;
