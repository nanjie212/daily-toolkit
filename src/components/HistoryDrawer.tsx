import { useState } from 'react';
import { XIcon, StarIcon, TrashIcon, ClockIcon, BookmarkIcon, ArrowLeftIcon } from 'lucide-react';
import { useStore, type SavedResult } from '@/store';
import OutputPanel from '@/components/OutputPanel';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
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
  const { resultHistory, favoriteResults, toggleFavoriteResult, removeResult, clearResultHistory } = useStore();
  const [tab, setTab] = useState<'history' | 'favorites'>('history');
  const [selected, setSelected] = useState<SavedResult | null>(null);

  if (!open) return null;

  const list = tab === 'history' ? resultHistory : favoriteResults;

  const handleDelete = (id: string) => {
    removeResult(id);
    if (selected?.id === id) setSelected(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-white/5 z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-bold text-white text-lg">
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
            {!selected && tab === 'history' && resultHistory.length > 0 && (
              <button
                onClick={() => { if (confirm('确定清空全部历史记录？此操作不可恢复。')) clearResultHistory(); }}
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
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                返回列表
              </button>
              <OutputPanel output={selected.output} toolId={selected.toolId} toolName={selected.toolName} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavoriteResult(selected.id)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm transition-all ${
                    favoriteResults.some((r) => r.id === selected.id)
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-white/5 text-gray-400 hover:text-amber-400'
                  }`}
                >
                  {favoriteResults.some((r) => r.id === selected.id) ? '已收藏' : '收藏'}
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
              {list.map((item) => {
                const isFav = favoriteResults.some((r) => r.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-surface rounded-xl border border-white/5 p-3 hover:border-white/10 transition-all cursor-pointer"
                    onClick={() => setSelected(item)}
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
                          onClick={() => toggleFavoriteResult(item.id)}
                          className={`p-1.5 rounded-lg transition-colors ${isFav ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                          title={isFav ? '取消收藏' : '收藏'}
                        >
                          <StarIcon className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
