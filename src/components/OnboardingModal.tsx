import { useId, useState } from 'react';
import { SparklesIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { builtInTools } from '@/tools';
import { safeStorage } from '@/lib/safeStorage';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/**
 * 新手引导「已看过」标记的 localStorage key。
 *
 * ⚠️ 这个 key 在项目里是**唯一**的一份：Home.tsx 判断首次访问、
 * 首屏搜索框聚焦时的静默关闭、以及本组件的「不再提示」都必须复用它，
 * 否则会出现两套互相打架的状态。
 */
export const ONBOARDING_STORAGE_KEY = 'onboarding-done';

/** 新手引导是否已经看过（读取失败 / 隐私模式下一律当作没看过，由 safeStorage 兜底）。 */
// eslint-disable-next-line react-refresh/only-export-components -- 该 helper 被 Home.tsx 复用，与存储 key 定义同文件避免两套状态
export function isOnboardingDone(): boolean {
  return safeStorage.getItem(ONBOARDING_STORAGE_KEY) !== null;
}

/** 写入「不再提示」标记。 */
// eslint-disable-next-line react-refresh/only-export-components -- 与 ONBOARDING_STORAGE_KEY 同源，Home.tsx 静默关闭时复用
export function markOnboardingDone(): void {
  safeStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
}

interface OnboardingModalProps {
  /** 关闭引导（只负责隐藏；是否持久化由本组件根据「不再提示」勾选状态决定）。 */
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  // 默认勾选：保持与改造前一致的行为（关掉就不再弹），取消勾选则下次访问还会出现
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const titleId = useId();
  const descriptionId = useId();

  /** 统一出口：先按勾选状态决定是否落盘，再交给父组件隐藏。 */
  const handleClose = () => {
    if (dontShowAgain) markOnboardingDone();
    onClose();
  };

  // Esc 关闭 + Tab 焦点循环 + 关闭后焦点归位，全部由该 hook 接管
  const dialogRef = useFocusTrap<HTMLDivElement>({ active: true, onEscape: handleClose });

  const steps = [
    {
      icon: SparklesIcon,
      title: '欢迎使用普通日常工具箱',
      // 工具数量从注册表动态读取，避免以后加工具时文案对不上
      description: `${builtInTools.length} 个实用工具，帮你更快完成日常任务`,
    },
    {
      icon: ShieldCheckIcon,
      title: '本地优先 · 隐私保护',
      description: '所有数据都在你的浏览器中处理，不会上传到任何服务器',
    },
    {
      icon: SparklesIcon,
      title: '无需注册，即开即用',
      description: '不用注册账号，不用安装软件，打开就能用',
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    // 背景遮罩：点击空白处关闭（内容区 stopPropagation 拦截冒泡）
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        className="bg-card border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 relative animate-scale-in"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <XIcon className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-accent" />
          </div>
          <h2 id={titleId} className="text-2xl font-heading font-bold text-white">
            {current.title}
          </h2>
          <p id={descriptionId} className="text-gray-400">
            {current.description}
          </p>
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-accent w-6' : 'bg-white/20'}`}
              />
            ))}
          </div>
          <div className="flex gap-3 w-full">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                上一步
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  handleClose();
                } else {
                  setStep(step + 1);
                }
              }}
              className="flex-1 py-3 rounded-xl bg-accent text-black font-semibold hover:bg-accent/90 transition-colors"
            >
              {isLast ? '开始使用' : '下一步'}
            </button>
          </div>

          {/* 「不再提示」：取消勾选后本次关闭不落盘，下次打开还会看到引导 */}
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
              className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
            />
            不再提示
          </label>
        </div>
      </div>
    </div>
  );
}
