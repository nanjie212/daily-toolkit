import { useLocation } from 'react-router-dom';
import { ClockIcon } from 'lucide-react';
import { safeStorage } from '@/lib/safeStorage';
import { useEffect, useState, useRef } from 'react';

/** 本地使用时长记录（localStorage `toolbox_usage_records` 的单条结构） */
interface UsageRecord {
  date: string;
  timestamp: number;
  duration?: number;
}

/**
 * 底部信息细条。
 *
 * 导航入口已全部上移（首页=品牌区、社区留言/关于/隐私=右上角 LeadBar），
 * 这里只保留：今日/本周时长、访问次数、slogan、版本号。
 * 桌面端固定 36px 高（md:h-9），与 Home 的一屏高度预算（100vh - 头部 - 36px）配套。
 */
export default function FooterBar() {
  const location = useLocation();

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);

  const [visitCount, setVisitCount] = useState<number | null>(null);
  const countedRef = useRef(false);

  // 每次会话只计一次访问（纯本地计数，无后端 API）
  useEffect(() => {
    if (countedRef.current) return;
    countedRef.current = true;
    const raw = safeStorage.getItem('toolbox_visit_count');
    const current = Number(raw || '0');
    const next = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
    safeStorage.setItem('toolbox_visit_count', String(next));
    setVisitCount(next);
  }, []);

  useEffect(() => {
    const updateStats = () => {
      const today = new Date().toDateString();
      let totalToday = 0;
      let totalWeek = 0;
      const records: UsageRecord[] = JSON.parse(localStorage.getItem('toolbox_usage_records') || '[]');
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      records.forEach((record) => {
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
      const records: UsageRecord[] = JSON.parse(localStorage.getItem('toolbox_usage_records') || '[]');
      const existing = records.find((r) => r.date === today);
      if (existing) {
        existing.duration = (existing.duration || 0) + duration;
      } else {
        records.push({ date: today, timestamp: Date.now(), duration });
      }
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = records.filter((r) => r.timestamp >= monthAgo);
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
    <footer className="bg-card/90 backdrop-blur-xl border-t border-white/5 md:h-9">
      <div className="max-w-5xl mx-auto px-4 py-2 md:py-0 md:h-full flex flex-wrap md:flex-nowrap md:overflow-hidden items-center justify-center gap-x-3 gap-y-0.5 whitespace-nowrap text-[11px] leading-4 text-gray-500">
        {/* 访问统计：今日 / 本周时长 + 访问次数 */}
        <span className="flex items-center gap-1">
          <ClockIcon className="w-3 h-3 text-accent" />
          <span>今日 <strong className="text-gray-300">{todayMinutes}</strong> 分钟</span>
        </span>
        <span aria-hidden="true" className="text-gray-700">·</span>
        <span>本周 <strong className="text-gray-300">{weekMinutes}</strong> 分钟</span>
        {visitCount !== null && (
          <>
            <span aria-hidden="true" className="text-gray-700">·</span>
            <span>访问 <strong className="text-gray-300">{visitCount}</strong> 次</span>
          </>
        )}

        {/* slogan（窄屏隐藏，保证单行不溢出） */}
        <span aria-hidden="true" className="hidden md:inline text-gray-700">·</span>
        <span className="hidden md:inline">
          普通日常工具箱 · 永久免费 · 无需注册 · 数据本地处理
        </span>

        {/* 版本号 */}
        <span aria-hidden="true" className="text-gray-700">·</span>
        <span>v{__APP_VERSION__} · 更新于 {__BUILD_DATE__}</span>
      </div>
    </footer>
  );
}
