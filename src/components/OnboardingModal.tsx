import { useState } from 'react';
import { SparklesIcon, ShieldCheckIcon, XIcon } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: SparklesIcon,
      title: '欢迎使用普通日常工具箱',
      description: '30+ 实用工具，帮你更快完成日常任务',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <XIcon className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-white">{current.title}</h2>
          <p className="text-gray-400">{current.description}</p>
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
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                上一步
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setStep(step + 1);
                }
              }}
              className="flex-1 py-3 rounded-xl bg-accent text-black font-semibold hover:bg-accent/90 transition-colors"
            >
              {isLast ? '开始使用' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
