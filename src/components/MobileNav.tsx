import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, ImageIcon, MenuIcon, XIcon, SparklesIcon, MessageCircleIcon, StoreIcon, HeartIcon, DollarSignIcon, Gamepad2Icon } from 'lucide-react';

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isHome = location.pathname === '/';
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category');
  const isCommunity = location.pathname === '/community';

  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          setMsgCount(Array.isArray(data) ? data.length : 0);
        }
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { icon: HomeIcon, label: '首页', path: '/', active: isHome && !currentCategory },
    { icon: ImageIcon, label: '图片', path: '/?category=image', active: currentCategory === 'image' },
    { icon: StoreIcon, label: '市场', path: '/market', active: location.pathname === '/market' },
    { icon: MenuIcon, label: '更多', path: '', active: false },
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
                aria-label={tab.label}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-14 left-0 right-0 bg-card border-t border-white/10 rounded-t-2xl p-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">全部分类</h3>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-gray-400">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'community', name: '社区留言', icon: MessageCircleIcon, color: 'text-pink-400', path: '/community', badge: msgCount },
                { id: 'everyday', name: '日常必备', icon: SparklesIcon, color: 'text-emerald-400', path: '/?category=everyday' },
                { id: 'image', name: '图片工具', icon: ImageIcon, color: 'text-blue-400', path: '/?category=image' },
                { id: 'health', name: '健康生活', icon: HeartIcon, color: 'text-red-400', path: '/?category=health' },
                { id: 'finance', name: '理财计算', icon: DollarSignIcon, color: 'text-amber-400', path: '/?category=finance' },
                { id: 'fun', name: '趣味娱乐', icon: Gamepad2Icon, color: 'text-purple-400', path: '/?category=fun' },
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
