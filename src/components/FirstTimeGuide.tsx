import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon, SparklesIcon, ArrowRightIcon } from 'lucide-react';
import { useStore } from '@/store';

interface FirstTimeGuideProps {
  /** 当前工具 id，避免推荐自身。 */
  currentToolId: string;
  /** 当前工具分类，用于优先推荐同分类工具。 */
  currentCategory: string;
  /** 关闭引导回调（写入 localStorage，引导仅显示一次）。 */
  onDismiss: () => void;
}

/**
 * 新用户首次完成工具后的轻量引导横幅。
 * 非弹窗式，柔和地推荐 3 个工具（优先同分类，不足则按近期使用补位）。
 */
export default function FirstTimeGuide({ currentToolId, currentCategory, onDismiss }: FirstTimeGuideProps) {
  const navigate = useNavigate();
  const { tools, recentToolIds } = useStore();

  const recommended = useMemo(() => {
    const sameCat = tools.filter(
      (t) => t.category === currentCategory && t.id !== currentToolId,
    );
    const recs = [...sameCat];
    if (recs.length < 3) {
      const byRecent = [...tools]
        .filter((t) => t.id !== currentToolId && !recs.some((r) => r.id === t.id))
        .sort((a, b) => recentToolIds.indexOf(a.id) - recentToolIds.indexOf(b.id));
      recs.push(...byRecent);
    }
    return recs.slice(0, 3);
  }, [tools, currentCategory, currentToolId, recentToolIds]);

  return (
    <div className="animate-fade-in bg-gradient-to-br from-accent/10 to-accent/[0.03] border border-accent/20 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-accent" />
          <h3 className="text-white font-medium text-sm">还能做更多 → 试试这些工具</h3>
        </div>
        <button
          onClick={onDismiss}
          aria-label="关闭引导"
          className="min-h-[32px] min-w-[32px] -mr-1 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recommended.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/tool/${t.id}`)}
            className="group text-left bg-surface border border-white/5 hover:border-accent/30 rounded-xl p-4 transition-all hover:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-white text-sm font-medium truncate">{t.name}</span>
              <ArrowRightIcon className="w-4 h-4 text-gray-500 group-hover:text-accent transition-colors flex-shrink-0" />
            </div>
            <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {t.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
