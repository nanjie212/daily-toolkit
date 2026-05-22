import { useState } from 'react';
import { HeartIcon, CoffeeIcon, ChevronDownIcon, XIcon } from 'lucide-react';

interface DonateSectionProps {
  wechatQr?: string;
  alipayQr?: string;
}

export default function DonateSection({ wechatQr, alipayQr }: DonateSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
          <div className="mb-5">
            <h3 className="text-white font-heading font-bold text-lg mb-1">支持开发者</h3>
            <p className="text-gray-400 text-sm">所有工具永久免费 · 赞赏支持服务器和维护</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setPreviewImage(wechatSrc)}
              className="bg-surface rounded-2xl p-4 text-center border border-white/5 hover:border-green-500/20 transition-all cursor-pointer group"
            >
              <div className="w-full aspect-square mx-auto mb-3 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden">
                <img src={wechatSrc} alt="微信赞赏码" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-green-400">
                <CoffeeIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">微信赞赏</span>
              </div>
            </div>

            <div
              onClick={() => setPreviewImage(alipaySrc)}
              className="bg-surface rounded-2xl p-4 text-center border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer group"
            >
              <div className="w-full aspect-square mx-auto mb-3 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden">
                <img src={alipaySrc} alt="支付宝赞赏码" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-blue-400">
                <CoffeeIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">支付宝赞赏</span>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-4">
            每一份赞赏都是继续开发的动力 💛
          </p>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-sm w-full bg-white rounded-2xl p-4" onClick={e => e.stopPropagation()}>
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