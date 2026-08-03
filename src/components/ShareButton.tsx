import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ShareIcon,
  X,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
} from 'lucide-react';

/**
 * 全局固定分享按钮 + 分享面板。
 *
 * - 按钮：fixed 定位在页面右上角，挂在 Layout 上，全站常驻，与是否使用工具无关。
 * - 面板：fixed 居中模态，含当前页二维码、保存二维码、复制链接（含降级方案）。
 *
 * 设计要点：
 * - z 层级：按钮 z-[300]、面板 z-[400]，均高于离线横幅 z-[200] 与底部导航 z-50，
 *   确保分享按钮始终在最上层且不被遮挡。
 * - 二维码内容为 currentUrl（HashRouter 下已含 #/tool/xxx，扫码直达当前页面）；面板打开期间监听
 *   hashchange / popstate，路由切换时二维码与标题实时刷新，不再停留在旧页面。
 * - 复制降级：优先 navigator.clipboard（需安全上下文），不可用时退回临时 textarea + execCommand，
 *   仍失败则展示只读输入框供手动复制。
 */
export default function ShareButton(): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copyError, setCopyError] = useState<boolean>(false);
  // 当前页面 URL 快照：随路由变化（hashchange/popstate）更新，驱动二维码与标题实时刷新
  const [currentUrl, setCurrentUrl] = useState<string>(
    typeof window !== 'undefined' ? window.location.href : '',
  );
  const copyTimer = useRef<number | null>(null);

  const isToolPage = currentUrl.includes('/tool/');
  const pageUrl = currentUrl;
  const title = isToolPage ? '分享这个工具' : '分享这个页面';

  // 是否处于安全上下文且支持异步剪贴板 API
  const canUseClipboard =
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof window !== 'undefined' &&
    window.isSecureContext;

  // 面板打开时生成二维码，并重置交互状态；监听路由变化实时刷新二维码
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCopied(false);
    setCopyError(false);
    setQrError(false);

    // 路由变化（含 HashRouter 的 hashchange 与浏览器前进/后退 popstate）时同步当前 URL
    const syncUrl = () => setCurrentUrl(window.location.href);
    window.addEventListener('hashchange', syncUrl);
    window.addEventListener('popstate', syncUrl);

    QRCode.toDataURL(currentUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then((url: string) => {
        if (!cancelled) {
          setQrDataUrl(url);
          setQrError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setQrError(true);
      });

    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', syncUrl);
      window.removeEventListener('popstate', syncUrl);
    };
  }, [open, currentUrl]);

  // Esc 键关闭面板
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // 卸载时清理定时器
  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  const scheduleReset = () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    const url = window.location.href;
    setCopyError(false);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        scheduleReset();
        return;
      }
      throw new Error('clipboard-unavailable');
    } catch {
      // 降级：临时 textarea + execCommand('copy')
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) {
          setCopied(true);
          scheduleReset();
          return;
        }
        throw new Error('execCommand-failed');
      } catch {
        setCopyError(true);
      }
    }
  };

  return (
    <>
      {/* 固定分享按钮：右上角常驻，点击切换面板。
          采用低调玻璃态样式，融入深色主题，不再使用高饱和实心胶囊。 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="分享"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed top-4 right-4 z-[300] flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-gray-300 shadow-sm hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95 transition-all"
      >
        <ShareIcon className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">分享</span>
      </button>

      {/* 分享面板：居中模态 + 半透明 backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90vw] max-w-sm bg-card border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in"
          >
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭"
              className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-white font-heading font-bold text-lg pr-8">
              {title}
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              扫码或复制链接，把当前页面分享给好友
            </p>

            {/* 二维码 */}
            <div className="mt-5 flex justify-center">
              {qrError ? (
                <div className="w-44 h-44 flex items-center justify-center rounded-xl bg-surface text-gray-500 text-xs text-center px-3">
                  二维码生成失败，请使用复制链接
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="分享二维码"
                  className="w-44 h-44 rounded-xl bg-white p-2"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center rounded-xl bg-surface">
                  <span className="text-gray-500 text-xs">生成中…</span>
                </div>
              )}
            </div>

            {/* 操作区 */}
            <div className="mt-5 flex flex-col gap-2.5">
              <a
                href={qrDataUrl || undefined}
                download="share-qr.png"
                onClick={(e) => {
                  if (!qrDataUrl) e.preventDefault();
                }}
                aria-disabled={!qrDataUrl}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-accent/15 text-accent text-sm font-medium hover:bg-accent/25 transition-all"
              >
                <DownloadIcon className="w-4 h-4" />
                保存二维码
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-all"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-accent" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
                {copied ? '已复制 ✓' : '复制链接'}
              </button>

              {copyError && (
                <p className="text-amber-400/80 text-xs text-center">
                  复制失败，请长按下方链接手动复制
                </p>
              )}

              {/* 非安全上下文或不支持 clipboard，或复制失败时的降级展示 */}
              {(!canUseClipboard || copyError) && (
                <input
                  readOnly
                  value={pageUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="当前页面链接"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-surface border border-white/10 text-gray-300 text-xs break-all focus:outline-none focus:border-accent/40"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
