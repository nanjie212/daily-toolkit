import { useState, useEffect, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, ImageIcon, MenuIcon, XIcon, SparklesIcon, MessageCircleIcon, StoreIcon, HeartIcon, DollarSignIcon, Gamepad2Icon } from 'lucide-react';
import { safeStorage } from '@/lib/safeStorage';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { categories } from '@/tools/categories';

/**
 * 取分类的正式名称（唯一事实来源是 `src/tools/categories.ts`）。
 *
 * 之前这里把 image 分类硬编码成「图片工具」，与 categories.ts 的「图片与PDF」对不上；
 * 改成按 id 反查后，以后改分类名不会再出现两处文案打架。
 */
function categoryName(id: string, fallback: string): string {
  return categories.find((category) => category.id === id)?.name ?? fallback;
}

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTitleId = useId();

  // 「更多」底部抽屉：Esc 关闭 + Tab 焦点循环 + 关闭后焦点回到「更多」按钮
  const sheetRef = useFocusTrap<HTMLDivElement>({
    active: sheetOpen,
    onEscape: () => setSheetOpen(false),
  });
  const isHome = location.pathname === '/';
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category');
  const isCommunity = location.pathname === '/community';

  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    const updateMsgCount = () => {
      const list = safeStorage.getJSON<unknown[]>('toolbox_community_messages', []);
      setMsgCount(Array.isArray(list) ? list.length : 0);
    };
    updateMsgCount();
    const interval = setInterval(updateMsgCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // 底部 tab 空间有限，可见文字用简称；无障碍名称统一用 categories.ts 的正式分类名
  const tabs = [
    { icon: HomeIcon, label: '首页', ariaLabel: '首页', path: '/', active: isHome && !currentCategory },
    {
      icon: ImageIcon,
      label: '图片',
      ariaLabel: categoryName('image', '图片与PDF'),
      path: '/?category=image',
      active: currentCategory === 'image',
    },
    { icon: StoreIcon, label: '市场', ariaLabel: '工具市场', path: '/market', active: location.pathname === '/market' },
    { icon: MenuIcon, label: '更多', ariaLabel: '更多分类', path: '', active: false },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="bg-card/90 backdrop-blur-xl border-t border-white/5">
          <div className="flex items-center justify-around h-14">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  if (tab.label === '更多') {
                    setSheetOpen(true);
                  } else {
                    navigate(tab.path);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  tab.active ? 'text-accent' : 'text-gray-500'
                }`}
                aria-label={tab.ariaLabel}
                aria-haspopup={tab.label === '更多' ? 'dialog' : undefined}
                aria-expanded={tab.label === '更多' ? sheetOpen : undefined}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSheetOpen(false)}
          role="presentation"
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
            className="absolute bottom-14 left-0 right-0 bg-card border-t border-white/10 rounded-t-2xl p-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id={sheetTitleId} className="text-white font-medium">全部分类</h3>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="关闭全部分类"
                className="p-1 text-gray-400"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'community', name: '社区留言', icon: MessageCircleIcon, color: 'text-pink-400', path: '/community', badge: msgCount },
                { id: 'everyday', name: categoryName('everyday', '日常必备'), icon: SparklesIcon, color: 'text-emerald-400', path: '/?category=everyday' },
                { id: 'image', name: categoryName('image', '图片与PDF'), icon: ImageIcon, color: 'text-blue-400', path: '/?category=image' },
                { id: 'health', name: categoryName('health', '健康生活'), icon: HeartIcon, color: 'text-red-400', path: '/?category=health' },
                { id: 'finance', name: categoryName('finance', '理财计算'), icon: DollarSignIcon, color: 'text-amber-400', path: '/?category=finance' },
                { id: 'fun', name: categoryName('fun', '趣味娱乐'), icon: Gamepad2Icon, color: 'text-purple-400', path: '/?category=fun' },
                { id: 'market', name: '工具市场', icon: StoreIcon, color: 'text-cyan-400', path: '/market' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    navigate(cat.path);
                    setSheetOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-white/5 transition-colors relative"
                >
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  <span className="text-gray-300 text-sm">{cat.name}</span>
                  {cat.badge && cat.badge > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
                      {cat.badge > 99 ? '99+' : cat.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
