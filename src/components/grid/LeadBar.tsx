import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InfoIcon, MessageCircleIcon, FileTextIcon, ShieldCheckIcon } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import AppreciateButton from './AppreciateButton';

/**
 * 顶部固定按钮条。
 *
 * - fixed top-right，z-[350]
 * - 社区留言 + 分享（强化版）+ 赞赏 + 关于，四按钮并排
 * - 社区留言按钮点击跳转到 /community
 * - 关于按钮展开小菜单：关于 / 隐私，分别跳转 /about（隐私额外滚动到隐私说明一节）
 */
export default function LeadBar() {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);

  // 点击菜单外部或按 Esc 时收起「关于」菜单
  useEffect(() => {
    if (!aboutOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAboutOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [aboutOpen]);

  /** 跳转 /about；scrollToPrivacy 时等懒加载分包渲染完再滚动到「隐私说明」一节 */
  const goAbout = (scrollToPrivacy: boolean) => {
    setAboutOpen(false);
    navigate('/about');
    if (scrollToPrivacy) {
      window.setTimeout(() => {
        document
          .getElementById('about-privacy')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  };

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

      {/* 关于按钮（含 关于/隐私 下拉菜单） */}
      <div className="relative" ref={aboutRef}>
        <button
          type="button"
          onClick={() => setAboutOpen((v) => !v)}
          aria-label="关于"
          aria-haspopup="menu"
          aria-expanded={aboutOpen}
          className="flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-gray-300 shadow-sm hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95 transition-all"
        >
          <InfoIcon className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">关于</span>
        </button>

        {aboutOpen && (
          <div
            role="menu"
            className="absolute top-full right-0 mt-2 z-[360] w-40 bg-card border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-1.5 animate-fade-in"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => goAbout(false)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <FileTextIcon className="w-4 h-4" />
              关于
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => goAbout(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              隐私
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
