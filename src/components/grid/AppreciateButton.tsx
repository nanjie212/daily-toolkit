import React, { useState, useId } from 'react';
import { ThumbsUpIcon, XIcon } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/**
 * 赞赏按钮（大拇指图标）。
 *
 * - 固定在页面右上角（与 LeadBar 协调）
 * - hover 触发 popover 浮层，展示微信 + 支付宝赞赏码
 * - 使用 useFocusTrap 保证无障碍
 */
export default function AppreciateButton() {
  const [open, setOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const previewTitleId = useId();

  const previewRef = useFocusTrap<HTMLDivElement>({
    active: previewImage !== null,
    onEscape: () => setPreviewImage(null),
  });

  // 图片路径（与 DonateSection 一致）
  const wechatSrc = '/wechat-donate.jpg';
  const alipaySrc = '/alipay-donate.jpg';

  return (
    <>
      {/* 按钮 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="赞赏"
        aria-expanded={open}
        className="relative flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-gray-300 shadow-sm hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95 transition-all"
      >
        <ThumbsUpIcon className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">赞赏</span>
      </button>

      {/* Popover 浮层 */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 z-[360] animate-fade-in"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/40 w-[280px]">
            <h3 className="text-white font-heading font-bold text-sm mb-3 text-center">
              支持开发者
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* 微信赞赏码 */}
              <div
                onClick={() => setPreviewImage(wechatSrc)}
                className="bg-surface rounded-xl p-3 text-center border border-white/5 hover:border-green-500/20 transition-all cursor-pointer group"
              >
                <div className="w-full aspect-square mx-auto mb-2 rounded-lg bg-white p-1.5 flex items-center justify-center overflow-hidden">
                  <img
                    src={wechatSrc}
                    alt="微信赞赏码"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs text-green-400 font-medium">微信赞赏</span>
              </div>

              {/* 支付宝赞赏码 */}
              <div
                onClick={() => setPreviewImage(alipaySrc)}
                className="bg-surface rounded-xl p-3 text-center border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer group"
              >
                <div className="w-full aspect-square mx-auto mb-2 rounded-lg bg-white p-1.5 flex items-center justify-center overflow-hidden">
                  <img
                    src={alipaySrc}
                    alt="支付宝赞赏码"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs text-blue-400 font-medium">支付宝赞赏</span>
              </div>
            </div>

            <p className="text-center text-gray-600 text-xs mt-3">
              每一份赞赏都是继续开发的动力 💛
            </p>
          </div>
        </div>
      )}

      {/* 预览放大浮层 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
          role="presentation"
        >
          <div
            ref={previewRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={previewTitleId}
            className="relative max-w-sm w-full bg-white rounded-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              aria-label="关闭赞赏码"
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700"
            >
              <XIcon className="w-4 h-4" />
            </button>
            <img src={previewImage} alt="赞赏码" className="w-full h-auto rounded-xl" />
            <p id={previewTitleId} className="text-center text-gray-500 text-xs mt-3">
              打开微信/支付宝扫一扫
            </p>
          </div>
        </div>
      )}
    </>
  );
}
