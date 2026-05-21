import { useState } from 'react';
import { ArrowRightIcon, RotateCcwIcon, SparklesIcon } from 'lucide-react';

interface KinshipCalculatorProps {
  onPathChange: (path: string) => void;
  onExecute: () => void;
}

const RELATIVES_BY_GROUP: { label: string; buttons: { label: string; value: string }[] }[] = [
  {
    label: '直系',
    buttons: [
      { label: '爸爸', value: '爸爸' },
      { label: '妈妈', value: '妈妈' },
      { label: '儿子', value: '儿子' },
      { label: '女儿', value: '女儿' },
    ],
  },
  {
    label: '配偶',
    buttons: [
      { label: '老公', value: '老公' },
      { label: '老婆', value: '老婆' },
    ],
  },
  {
    label: '同辈',
    buttons: [
      { label: '哥哥', value: '哥哥' },
      { label: '弟弟', value: '弟弟' },
      { label: '姐姐', value: '姐姐' },
      { label: '妹妹', value: '妹妹' },
    ],
  },
];

export default function KinshipCalculator({ onPathChange, onExecute }: KinshipCalculatorProps) {
  const [path, setPath] = useState<string[]>(['我']);
  const [showResult, setShowResult] = useState(false);

  const addRelative = (value: string) => {
    const newPath = [...path, '的', value];
    setPath(newPath);
    onPathChange(newPath.join(''));
    setShowResult(false);
  };

  const removeLast = () => {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -2);
    setPath(newPath);
    onPathChange(newPath.join(''));
    setShowResult(false);
  };

  const resetAll = () => {
    setPath(['我']);
    onPathChange('');
    setShowResult(false);
  };

  const handleCalculate = () => {
    setShowResult(true);
    onPathChange(path.join(''));
    onExecute();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-medium">亲属关系计算器</h3>
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors"
          >
            <RotateCcwIcon className="w-3 h-3" />
            重置
          </button>
        </div>

        <div className="bg-surface rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {path.map((part, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-md ${
                  part === '的' ? 'text-gray-500 text-xs' : 'bg-accent/20 text-accent font-medium'
                }`}
              >
                {part}
              </span>
            ))}
          </div>
        </div>

        {path.length > 1 && (
          <button
            onClick={removeLast}
            className="w-full mb-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs transition-all"
          >
            撤销上一步
          </button>
        )}

        <div className="space-y-3">
          {RELATIVES_BY_GROUP.map((group) => (
            <div key={group.label}>
              <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1.5 block">{group.label}</span>
              <div className="grid grid-cols-4 gap-2">
                {group.buttons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => addRelative(btn.value)}
                    className="py-2.5 rounded-xl bg-surface border border-white/5 hover:border-accent/30 hover:bg-accent/10 text-gray-300 hover:text-accent text-sm font-medium transition-all active:scale-95"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCalculate}
          disabled={path.length <= 1}
          className="w-full mt-4 py-3 rounded-xl bg-accent/20 border border-accent/30 text-accent font-medium text-sm hover:bg-accent/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="w-4 h-4" />
          计算称呼
        </button>
      </div>
    </div>
  );
}