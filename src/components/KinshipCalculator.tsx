import { useState } from 'react';
import { Undo2Icon, RotateCcwIcon, SparklesIcon, UserIcon, ChevronRightIcon, LightbulbIcon, UsersIcon } from 'lucide-react';

interface KinshipCalculatorProps {
  onExecute: (path: string) => void;
}

const RELATIVES_BY_GROUP: { label: string; buttons: { label: string; value: string; icon?: string }[] }[] = [
  {
    label: '长辈',
    buttons: [
      { label: '爸爸', value: '爸爸', icon: '👨' },
      { label: '妈妈', value: '妈妈', icon: '👩' },
      { label: '爷爷', value: '爷爷', icon: '👴' },
      { label: '奶奶', value: '奶奶', icon: '👵' },
      { label: '外公', value: '外公', icon: '👴' },
      { label: '外婆', value: '外婆', icon: '👵' },
    ],
  },
  {
    label: '配偶',
    buttons: [
      { label: '老公', value: '老公', icon: '👨' },
      { label: '老婆', value: '老婆', icon: '👩' },
    ],
  },
  {
    label: '平辈',
    buttons: [
      { label: '哥哥', value: '哥哥', icon: '👨' },
      { label: '弟弟', value: '弟弟', icon: '👨' },
      { label: '姐姐', value: '姐姐', icon: '👩' },
      { label: '妹妹', value: '妹妹', icon: '👩' },
    ],
  },
  {
    label: '晚辈',
    buttons: [
      { label: '儿子', value: '儿子', icon: '👦' },
      { label: '女儿', value: '女儿', icon: '👧' },
      { label: '侄子', value: '侄子', icon: '👦' },
      { label: '侄女', value: '侄女', icon: '👧' },
    ],
  },
];

export default function KinshipCalculator({ onExecute }: KinshipCalculatorProps) {
  const [path, setPath] = useState<string[]>(['我']);
  const [startFrom, setStartFrom] = useState('我');
  const [showStartPicker, setShowStartPicker] = useState(false);

  const addRelative = (value: string) => {
    setPath((prev) => [...prev, '的', value]);
  };

  const removeLast = () => {
    setPath((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -2);
    });
  };

  const resetAll = () => {
    setPath([startFrom]);
  };

  const changeStartPerson = (person: string) => {
    setStartFrom(person);
    setPath([person]);
    setShowStartPicker(false);
  };

  const handleCalculate = () => {
    onExecute(path.join(''));
  };

  const pathDisplay = path.map((part, i) => {
    if (part === '的') return null;
    const isLast = i === path.length - 1 || (i === path.length - 2 && path[path.length - 1] === '的');
    return (
      <span key={i} className="inline-flex items-center gap-1">
        {i === 0 && (
          <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
            {startFrom === '我' ? '我' : '你'}
          </span>
        )}
        {i > 0 && path[i - 1] !== '的' && <ChevronRightIcon className="w-3 h-3 text-gray-600" />}
        <span
          className={`px-2 py-0.5 rounded-md text-sm ${
            isLast && (path[i + 1] === '的' || i === path.length - 1)
              ? 'bg-accent/20 text-accent font-semibold'
              : 'text-gray-400'
          }`}
        >
          {part}
        </span>
      </span>
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
        {/* 头部：从谁开始 + 重置 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-accent" />
            <h3 className="text-white text-sm font-medium">亲属关系计算器</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStartPicker(!showStartPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface text-gray-400 hover:text-white text-xs transition-all"
            >
              <UserIcon className="w-3 h-3" />
              {startFrom === '我' ? '从我出发' : `从${startFrom}出发`}
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white text-xs transition-all hover:bg-white/5"
            >
              <RotateCcwIcon className="w-3 h-3" />
              重置
            </button>
          </div>
        </div>

        {/* 更改起点 */}
        {showStartPicker && (
          <div className="bg-surface rounded-xl p-3 animate-fade-in">
            <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider block mb-2">选择关系起点</span>
            <div className="flex flex-wrap gap-2">
              {['我', '爸爸', '妈妈', '儿子', '女儿', '爷爷', '奶奶'].map((p) => (
                <button
                  key={p}
                  onClick={() => changeStartPerson(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    startFrom === p
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-card text-gray-400 border border-white/5 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 路径展示 */}
        <div className="bg-surface rounded-xl p-4 min-h-[56px] flex items-center">
          <div className="flex flex-wrap items-center gap-1">
            {pathDisplay}
          </div>
        </div>

        {/* 撤销 */}
        {path.length > 1 && (
          <button
            onClick={removeLast}
            className="w-full py-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Undo2Icon className="w-3.5 h-3.5" />
            撤销上一步
          </button>
        )}

        {/* 关系按钮 */}
        <div className="space-y-3">
          {RELATIVES_BY_GROUP.map((group) => (
            <div key={group.label}>
              <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-2 block">
                {group.label}
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {group.buttons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => addRelative(btn.value)}
                    className="py-2.5 px-2 rounded-xl bg-surface border border-white/5 hover:border-accent/30 hover:bg-accent/10 text-gray-300 hover:text-accent text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>{btn.icon}</span>
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 计算按钮 */}
        <button
          onClick={handleCalculate}
          disabled={path.length <= 1}
          className="w-full py-3 rounded-xl bg-accent/20 border border-accent/30 text-accent font-medium text-sm hover:bg-accent/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <SparklesIcon className="w-4 h-4" />
          计算称呼
        </button>
      </div>

      {/* 提示 */}
      <div className="bg-surface/50 border border-white/5 rounded-xl px-4 py-3 flex items-start gap-3">
        <LightbulbIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-400 leading-relaxed">
          <p>从「{startFrom === '我' ? '我' : startFrom}」出发，依次选择亲属关系链条。</p>
          <p className="mt-0.5">例如：{startFrom === '我' ? '我' : startFrom} → 爸爸 → 爸爸 = 爷爷</p>
        </div>
      </div>
    </div>
  );
}