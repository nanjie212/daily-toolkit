import { useNavigate, useLocation } from 'react-router-dom';
import {
  WrenchIcon,
  ClockIcon,
  MessageCircleIcon,
  TerminalIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useStore } from '@/store';
import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';

export default function FooterBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDev = location.pathname === '/developer';
  const isCommunity = location.pathname === '/community';

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);

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

  useEffect(() => {
    const updateStats = () => {
      const today = new Date().toDateString();
      let totalToday = 0;
      let totalWeek = 0;
      const records = JSON.parse(localStorage.getItem('toolbox_usage_records') || '[]');
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      records.forEach((record: any) => {
        if (record.date === today) totalToday += record.duration || 0;
        if (record.timestamp >= weekAgo) totalWeek += record.duration || 0;
      });
      setTodayMinutes(Math.round(totalToday / 60));
      setWeekMinutes(Math.round(totalWeek / 60));
    };
    updateStats();
    const interval = setInterval(updateStats, 60000);
    return () => clearInterval(interval);
  }, []);

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
        records.push({ date: today, timestamp: Date.now(), duration });
      }
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = records.filter((r: any) => r.timestamp >= monthAgo);
      localStorage.setItem('toolbox_usage_records', JSON.stringify(filtered));
    };
    window.addEventListener('beforeunload', saveDuration);
    window.addEventListener('pagehide', saveDuration);
    return () => {
      window.removeEventListener('beforeunload', saveDuration);
      window.removeEventListener('pagehide', saveDuration);
      saveDuration();
    };
  }, [location.pathname]);

  return (
    <footer className="bg-card/90 backdrop-blur-xl border-t border-white/5 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* 品牌 + 统计 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <WrenchIcon className="w-5 h-5 text-accent" />
            </div>
            <span className="text-white font-heading font-bold text-base">日常工具箱</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <ClockIcon className="w-3.5 h-3.5 text-accent" />
            <span>今日 <strong className="text-white">{todayMinutes}</strong> 分钟</span>
            <span className="text-gray-600">·</span>
            <span>本周 <strong className="text-white">{weekMinutes}</strong> 分钟</span>
          </div>
        </div>

        {/* 导航链接 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/community')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              isCommunity
                ? 'text-accent bg-accent/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="relative">
              <MessageCircleIcon className="w-4 h-4" />
              {msgCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-bold text-white">
                  {msgCount > 99 ? '99+' : msgCount}
                </span>
              )}
            </div>
            社区留言
          </button>

          <button
            onClick={() => navigate('/developer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              isDev
                ? 'text-accent bg-accent/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            开发者中心
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400">
            <ShieldCheckIcon className="w-4 h-4 text-accent" />
            <span className="text-xs">数据仅保存在本地，不会上传任何服务器</span>
          </div>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* 底部版权 */}
        <div className="text-center text-gray-600 text-[10px] space-y-1">
          <p>普通日常工具箱 · 所有工具永久免费 · 无需注册 · 数据不上传服务器</p>
          <p>v{__APP_VERSION__} · 更新于 {__BUILD_DATE__}</p>
        </div>
      </div>
    </footer>
  );
}