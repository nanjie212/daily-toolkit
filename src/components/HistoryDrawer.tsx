import { useState, useEffect, useId } from 'react';
import { XIcon, StarIcon, TrashIcon, ClockIcon, BookmarkIcon, ArrowLeftIcon } from 'lucide-react';
import type { ToolOutput } from '@/types';
import OutputPanel from '@/components/OutputPanel';
import { safeStorage } from '@/lib/safeStorage';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface SavedResult {
  id: string;
  toolId: string;
  toolName: string;
  output: ToolOutput;
  createdAt: number;
  favorite: boolean;
}

const HISTORY_KEY = 'toolbox_result_history';

function loadHistory(): SavedResult[] {
  const list = safeStorage.getJSON<SavedResult[]>(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveHistory(list: SavedResult[]): void {
  safeStorage.setJSON(HISTORY_KEY, list);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function snippet(result: SavedResult): string {
  const data = result.output.data;
  if (typeof data === 'string') return data.slice(0, 60);
  if (data && typeof data === 'object') {
    const entries = Object.entries(data).filter(([k]) => k !== 'type');
    if (entries.length) return entries.slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(' · ');
  }
  return result.toolName;
}

export default function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const [tab, setTab] = useState<'history' | 'favorites'>('history');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<SavedResult[]>(() => loadHistory());
  const titleId = useId();

  // Esc 关闭 + Tab 焦点循环 + 关闭后焦点归位
  const drawerRef = useFocusTrap<HTMLDivElement>({ active: open, onEscape: onClose });

  // 每次打开时重新从 localStorage 读取，保证外部写入也能被看到
  useEffect(() => {
    if (open) setResults(loadHistory());
  }, [open]);

  if (!open) return null;

  const selected = results.find((item) => item.id === selectedId) ?? null;
  const list = tab === 'history' ? results : results.filter((item) => item.favorite);

  const handleDelete = (id: string) => {
    setResults((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveHistory(next);
      return next;
    });
    if (selectedId === id) setSelectedId(null);
  };

  const handleToggleFavorite = (id: string) => {
    setResults((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item));
      saveHistory(next);
      return next;
    });
  };

  const handleClearHistory = () => {
    setResults([]);
    saveHistory([]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} role="presentation" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-white/5 z-50 flex flex-col animate-slide-in-right"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h2 id={titleId} className="font-heading font-bold text-white text-lg">
              {selected ? '结果详情' : '我的结果'}
            </h2>
            {!selected && (
              <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
                <button
                  onClick={() => setTab('history')}
                  className={`px-3 py-1 rounded-md text-xs transition-all ${tab === 'history' ? 'bg-accent/20 text-accent' : 'text-gray-400'}`}
                >
                  历史
                </button>
                <button
                  onClick={() => setTab('favorites')}
                  className={`px-3 py-1 rounded-md text-xs transition-all ${tab === 'favorites' ? 'bg-accent/20 text-accent' : 'text-gray-400'}`}
                >
                  收藏
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!selected && tab === 'history' && results.length > 0 && (
              <button
                onClick={() => { if (confirm('确定清空全部历史记录？此操作不可恢复。')) handleClearHistory(); }}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                清空
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selected ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                返回列表
              </button>
              <OutputPanel output={selected.output} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFavorite(selected.id)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm transition-all ${
                    selected.favorite
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-white/5 text-gray-400 hover:text-amber-400'
                  }`}
                >
                  {selected.favorite ? '已收藏' : '收藏'}
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="px-3 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 transition-all"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {tab === 'history' ? <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-30" /> : <BookmarkIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />}
              <p className="text-lg">{tab === 'history' ? '还没有历史记录' : '还没有收藏'}</p>
              <p className="text-sm mt-1">运行工具后，结果会自动保存在这里</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface rounded-xl border border-white/5 p-3 hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">{item.toolName}</span>
                        <span className="text-gray-600 text-[10px] flex-shrink-0">{timeAgo(item.createdAt)}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 truncate">{snippet(item)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleFavorite(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${item.favorite ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                        title={item.favorite ? '取消收藏' : '收藏'}
                      >
                        <StarIcon className="w-4 h-4" fill={item.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
