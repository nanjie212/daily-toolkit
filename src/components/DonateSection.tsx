import { useState } from 'react';
import { HeartIcon, CoffeeIcon, ChevronDownIcon, XIcon } from 'lucide-react';

interface DonateSectionProps {
  wechatQr?: string;
  alipayQr?: string;
}

export default function DonateSection({ wechatQr, alipayQr }: DonateSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('donate-dismissed') === '1');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (dismissed) return null;

  const wechatSrc = wechatQr || '/wechat-donate.jpg';
  const alipaySrc = alipayQr || '/alipay-donate.jpg';

  return (
    <div className="animate-fade-in bg-card border border-white/5 rounded-2xl overflow-hidden">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <HeartIcon className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">喜欢这个工具箱？</p>
              <p className="text-gray-500 text-xs">请作者喝杯咖啡，支持持续开发 ☕</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChevronDownIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </div>
        </button>
      ) : (
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-white font-heading font-bold text-lg mb-1">支持开发者</h3>
              <p className="text-gray-400 text-sm">
                所有工具永久免费 · 赞赏支持服务器和维护
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { localStorage.setItem('donate-dismissed', '1'); setDismissed(true); }}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5"
                title="不再显示"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-5 text-center border border-white/5 hover:border-green-500/20 transition-all">
              <div
                onClick={() => setPreviewImage(wechatSrc)}
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-4 rounded-xl bg-white p-3 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform group relative"
              >
                <img src={wechatSrc} alt="微信赞赏码" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center rounded-xl">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded transition-opacity">点击放大</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CoffeeIcon className="w-4 h-4" />
                <span className="text-sm font-medium">微信赞赏</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">打开微信扫一扫</p>
            </div>

            <div className="bg-surface rounded-2xl p-5 text-center border border-white/5 hover:border-blue-500/20 transition-all">
              <div
                onClick={() => setPreviewImage(alipaySrc)}
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-4 rounded-xl bg-white p-3 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform group relative"
              >
                <img src={alipaySrc} alt="支付宝赞赏码" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center rounded-xl">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded transition-opacity">点击放大</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <CoffeeIcon className="w-4 h-4" />
                <span className="text-sm font-medium">支付宝赞赏</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">打开支付宝扫一扫</p>
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-5">
            所有工具永久免费，每一份赞赏都是继续开发的动力 💛
          </p>
        </div>
      )}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-md w-full bg-white rounded-2xl p-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700"
            >
              <XIcon className="w-4 h-4" />
            </button>
            <img src={previewImage} alt="赞赏码" className="w-full h-auto rounded-xl" />
            <p className="text-center text-gray-500 text-xs mt-3">打开微信/支付宝扫一扫</p>
          </div>
        </div>
      )}
    </div>
  );
}
