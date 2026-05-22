import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClockIcon,
  MessageCircleIcon,
  TerminalIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from 'lucide-react';
import { useStore } from '@/store';
import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isMarket = location.pathname === '/market';
  const isDev = location.pathname === '/developer';
  const isCommunity = location.pathname === '/community';

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);

  const msgCount = (() => {
    try {
      const msgs = JSON.parse(localStorage.getItem('toolbox_community_messages') || '[]');
      return Array.isArray(msgs) ? msgs.length : 0;
    } catch { return 0; }
  })();

  // 计算使用时长
  useEffect(() => {
    const updateStats = () => {
      const today = new Date().toDateString();
      let totalToday = 0;
      let totalWeek = 0;

      const records = JSON.parse(localStorage.getItem('toolbox_usage_records') || '[]');
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      records.forEach((record: any) => {
        if (record.date === today) {
          totalToday += record.duration || 0;
        }
        if (record.timestamp >= weekAgo) {
          totalWeek += record.duration || 0;
        }
      });

      setTodayMinutes(Math.round(totalToday / 60));
      setWeekMinutes(Math.round(totalWeek / 60));
    };

    updateStats();
    const interval = setInterval(updateStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // 记录页面停留时间
  useEffect(() => {
    const startTime = Date.now();
    const today = new Date().toDateString();

    const saveDuration = () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const records = JSON.parse(localStorage.getItem('toolbox_usage_records') || '[]');
      const existing = records.find((r: any) => r.date === today);

      if (existing) {
        existing.duration = (existing.duration || 0) + duration;
      } else {
        records.push({
          date: today,
          timestamp: Date.now(),
          duration,
        });
      }

      // 只保留最近30天
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = records.filter((r: any) => r.timestamp >= monthAgo);
      localStorage.setItem('toolbox_usage_records', JSON.stringify(filtered));
    };

    const beforeUnload = (e: BeforeUnloadEvent) => {
      saveDuration();
    };

    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      saveDuration();
    };
  }, [location.pathname]);

  return (
    <aside className="hidden md:flex w-16 hover:w-64 transition-all duration-300 bg-card border-r border-white/5 flex-col h-full overflow-hidden group/sidebar">
      <div className="p-4 flex items-center gap-3 border-b border-white/5 min-h-[64px]">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <WrenchIcon className="w-5 h-5 text-accent" />
        </div>
        <span className="text-white font-heading font-bold text-lg whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          日常工具箱
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-end py-4 px-2">
        {/* 使用时长统计 */}
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-white opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              使用时长
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            <div className="bg-white/5 rounded p-2 text-center">
              <div className="text-xs text-gray-400">今日</div>
              <div className="text-lg font-bold text-white">{todayMinutes}</div>
              <div className="text-[10px] text-gray-500">分钟</div>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <div className="text-xs text-gray-400">本周</div>
              <div className="text-lg font-bold text-white">{weekMinutes}</div>
              <div className="text-[10px] text-gray-500">分钟</div>
            </div>
          </div>
        </div>

        {/* 社区留言 */}
        <button
          onClick={() => navigate('/community')}
          aria-label="社区留言"
          className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 mb-1 ${
            isCommunity
              ? 'text-accent bg-accent/10 border-r-2 border-accent rounded-r-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5 rounded'
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

        {/* 开发者中心 */}
        <button
          onClick={() => navigate('/developer')}
          aria-label="开发者中心"
          className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 mb-1 ${
            isDev
              ? 'text-accent bg-accent/10 border-r-2 border-accent rounded-r-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5 rounded'
          }`}
        >
          <TerminalIcon className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            开发者中心
          </span>
        </button>

        {/* 隐私保护说明 */}
        <div className="mt-4 p-3 bg-gradient-to-r from-accent/10 to-transparent rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-white opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                本地优先
              </span>
            </div>
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
              <ThemeToggle />
            </div>
          </div>
          <div className="text-[11px] text-gray-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 leading-relaxed">
            所有数据保存在本地浏览器，不会上传到任何服务器
          </div>
        </div>
      </div>
    </aside>
  );
}
