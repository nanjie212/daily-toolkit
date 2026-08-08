import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircleIcon } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import AppreciateButton from './AppreciateButton';

/**
 * 顶部固定按钮条。
 *
 * - fixed top-right，z-[350]
 * - 分享按钮（强化版）+ 社区留言按钮 + 赞赏按钮，三按钮并排
 * - 社区留言按钮点击跳转到 /community
 */
export default function LeadBar() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-4 right-4 z-[350] flex items-center gap-2">
      {/* 社区留言按钮 */}
      <button
        type="button"
        onClick={() => navigate('/community')}
        aria-label="社区留言"
        className="flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-gray-300 shadow-sm hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95 transition-all"
      >
        <MessageCircleIcon className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">社区留言</span>
      </button>

      {/* 分享按钮 */}
      <ShareButton />

      {/* 赞赏按钮（相对定位容器） */}
      <div className="relative">
        <AppreciateButton />
      </div>
    </div>
  );
}
