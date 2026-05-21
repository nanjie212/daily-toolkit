import { useState, useMemo } from 'react';
import { CopyIcon, CheckIcon, DownloadIcon, AlertCircleIcon } from 'lucide-react';
import type { ToolOutput } from '@/types';

interface OutputPanelProps {
  output: ToolOutput | null;
}

const LABEL_ICONS: Record<string, string> = {
  金额: '💰', 利息: '💸', 总还款: '🏦', 月供: '📋', 到手价: '🏷️',
  原价: '💰', 折扣: '🏷️', 省了: '🎉', 结果: '✨', 原文: '📝',
  手机号: '📱', 运营商: '📡', 归属地: '📍', 身份证号: '🆔',
  发证地区: '📍', 出生日期: '🎂', 年龄: '📅', 性别: '👤',
  生肖: '🐲', 星座: '⭐', 公历日期: '📅', 星期: '📆',
  干支纪年: '🏮', 节气参考: '🌿', 生命阶段: '🌱',
  宠物类型: '🐾', 相当于人类: '👨', 提示: '💡',
  开始日期: '📌', 结束日期: '📍', 自然日: '📆', 工作日: '💼',
  节假日: '🎉', 下次经期: '🔴', 经期结束: '🟤', 排卵期: '🟡',
  当前状态: '📊', 周期: '🔄', 算法: '⚙️', 哈希值: '🔐',
  格式: '📎', Base64结果: '🔑', 加权总分: '📊', 总权重: '⚖️',
  等级: '🏅', 各项明细: '📋',
};

const VALUE_ICONS: Record<string, string> = {
  excellent: '🌟', good: '👍', normal: '👌', bad: '⚠️',
};

const KEYWORD_ICONS: Record<string, { icon: string; color: string }> = {
  '结果': { icon: '✨', color: 'from-purple-500 to-pink-500' },
  '总': { icon: '🏆', color: 'from-amber-500 to-orange-500' },
  '到手': { icon: '🎯', color: 'from-emerald-500 to-green-500' },
  '省': { icon: '🎉', color: 'from-rose-500 to-red-500' },
  '月供': { icon: '📋', color: 'from-blue-500 to-indigo-500' },
  '利息': { icon: '💸', color: 'from-red-500 to-rose-500' },
  '金额': { icon: '💰', color: 'from-emerald-500 to-teal-500' },
  '分数': { icon: '📊', color: 'from-violet-500 to-purple-500' },
  '得分': { icon: '📊', color: 'from-violet-500 to-purple-500' },
  '年龄': { icon: '📅', color: 'from-cyan-500 to-blue-500' },
  '身高': { icon: '📏', color: 'from-sky-500 to-cyan-500' },
  '体重': { icon: '⚖️', color: 'from-stone-500 to-slate-500' },
  '概率': { icon: '🎲', color: 'from-fuchsia-500 to-purple-500' },
};

function getKeyEmoji(key: string): string {
  return LABEL_ICONS[key] || '📌';
}

function detectIconAndGradient(key: string, value: string): { bgGradient: string; badgeColor: string } {
  for (const [kw, info] of Object.entries(KEYWORD_ICONS)) {
    if (key.includes(kw)) {
      return { bgGradient: info.color, badgeColor: 'text-white' };
    }
  }
  return { bgGradient: 'from-gray-500 to-gray-600', badgeColor: 'text-gray-200' };
}

function formatValue(value: unknown): { display: string; isNumeric: boolean; isCurrency: boolean; isPercent: boolean } {
  const strValue = String(value ?? '');
  const numStr = strValue.replace(/[,，]/g, '').replace(/[¥￥$€£]/g, '').trim();
  const num = parseFloat(numStr);
  const isNumeric = !isNaN(num) && numStr !== '';
  const isCurrency = /[¥￥$€£]/.test(strValue);
  const isPercent = strValue.includes('%');
  return { display: strValue, isNumeric, isCurrency, isPercent };
}

export default function OutputPanel({ output }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!output) return null;

  const handleCopy = () => {
    const text = typeof output.data === 'string'
      ? output.data
      : JSON.stringify(output.data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (output.downloadUrl) {
      const a = document.createElement('a');
      a.href = output.downloadUrl;
      a.download = output.filename || 'download';
      a.click();
    }
  };

  if (!output.success) {
    return (
      <div className="animate-error-shake bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircleIcon className="w-5 h-5 text-red-400" />
          <h3 className="text-red-400 font-medium">执行失败</h3>
        </div>
        <p className="text-red-300/80 text-sm">{output.error}</p>
      </div>
    );
  }

  const isImageData = typeof output.data === 'string' && output.data.startsWith('data:image');
  const isTextData = typeof output.data === 'string';
  const isImageOutput = !!output.downloadUrl && (output.filename?.endsWith('.png') || output.filename?.endsWith('.jpg') || output.filename?.endsWith('.jpeg') || output.filename?.endsWith('.webp'));
  const isEmojiGrid = output.data && typeof output.data === 'object' && !Array.isArray(output.data) && (output.data as Record<string, string>)['type'] === 'emoji-grid';
  const isSizeTable = output.data && typeof output.data === 'object' && !Array.isArray(output.data) && (output.data as Record<string, string>)['type'] === 'size-table';

  return (
    <div className="animate-fade-in bg-card border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <h3 className="text-white font-medium text-sm">执行结果</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/10 transition-all"
            title="复制"
          >
            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
          </button>
          {output.downloadUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-all"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              下载图片
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isImageData ? (
          <div className="flex justify-center">
            <img
              src={output.data as string}
              alt="输出图片"
              className="max-w-full max-h-96 rounded-xl border border-white/10 shadow-lg"
            />
          </div>
        ) : isImageOutput ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={output.downloadUrl!}
                alt="处理后的图片"
                className="max-w-full max-h-96 rounded-xl border border-white/10 shadow-lg"
              />
            </div>
            {output.data && typeof output.data === 'object' && !(output.data as Record<string, string>)['type'] && (
              <DataGrid data={output.data as Record<string, unknown>} />
            )}
          </div>
        ) : isEmojiGrid ? (
          <EmojiGridDisplay data={output.data as Record<string, string>} />
        ) : isSizeTable ? (
          <SizeTableDisplay data={output.data as Record<string, string>} />
        ) : isTextData ? (
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <pre className="text-gray-300 text-sm whitespace-pre-wrap break-all font-sans leading-relaxed">
              {output.data as string}
            </pre>
          </div>
        ) : output.data && typeof output.data === 'object' ? (
          <DataGrid data={output.data as Record<string, unknown>} />
        ) : (
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <pre className="text-gray-300 text-sm whitespace-pre-wrap break-all font-mono">
              {JSON.stringify(output.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function findHighlightEntry(entries: [string, unknown][]): [string, string] | null {
  for (const [key] of entries) {
    if (key.includes('结果') || key === 'result' || key.includes('到手') || key.includes('得分') || key.includes('总分')) {
      const value = String(entries.find(([k]) => k === key)?.[1] || '');
      return [key, value];
    }
  }
  const numericEntries = entries.filter(([, v]) => {
    const s = String(v).replace(/[¥￥$€£%,，\s]/g, '');
    return !isNaN(parseFloat(s)) && s.length > 0;
  });
  if (numericEntries.length > 0) {
    return numericEntries[0] as [string, string];
  }
  return null;
}

function DataGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([key]) => key !== 'type');
  const highlight = findHighlightEntry(entries);

  const normalEntries = highlight
    ? entries.filter(([k]) => k !== highlight[0])
    : entries;

  return (
    <div className="space-y-3">
      {highlight && (() => {
        const [key, value] = highlight;
        const fmt = formatValue(value);
        return (
          <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border border-accent/20 p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative">
              <span className="text-accent/60 text-[10px] font-medium uppercase tracking-widest">{key}</span>
              <p className="text-3xl font-heading font-bold text-accent mt-1">
                {fmt.isCurrency && <span className="text-lg mr-0.5 opacity-70">{value.match(/[¥￥$€£]/)?.[0] || ''}</span>}
                {fmt.isNumeric ? fmt.display.replace(/[¥￥$€£]/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') : fmt.display}
              </p>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {normalEntries.map(([key, rawValue]) => {
          const value = String(rawValue);
          const fmt = formatValue(value);
          const icon = getKeyEmoji(key);
          const isImportant = key.includes('月供') || key.includes('利息') || key.includes('总') || key.includes('省');

          if (key === '提示') {
            return (
              <div key={key} className="col-span-full bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">💡</span>
                  <div className="space-y-0.5">
                    {value.split('\n').map((line, i) => (
                      <p key={i} className="text-amber-300/70 text-xs leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (key.includes('各项明细')) {
            return (
              <div key={key} className="col-span-full bg-surface rounded-xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                  <span className="text-xs">📋</span>
                  <span className="text-gray-500 text-xs font-medium">{key}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {value.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} className="px-4 py-2 text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/50 flex-shrink-0" />
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          const cardBg = isImportant
            ? 'bg-gradient-to-br from-surface to-blue-500/[0.02] border-blue-500/10'
            : 'bg-surface border-white/5';

          return (
            <div key={key} className={`relative rounded-xl px-4 py-3 border transition-all hover:border-white/10 ${cardBg}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs">{icon}</span>
                <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider leading-none">{key}</span>
              </div>
              <p className={`leading-tight ${fmt.isNumeric && !fmt.isPercent && !fmt.isCurrency ? 'text-white text-lg font-bold' : fmt.isCurrency || fmt.isPercent ? 'text-accent text-base font-semibold' : 'text-white text-sm font-medium'}`}>
                {fmt.display}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmojiGridDisplay({ data }: { data: Record<string, string> }) {
  const [copiedEmoji, setCopiedEmoji] = useState('');

  const handleCopy = (emoji: string) => {
    navigator.clipboard.writeText(emoji);
    setCopiedEmoji(emoji);
    setTimeout(() => setCopiedEmoji(''), 1500);
  };

  return (
    <div className="space-y-4">
      {Object.entries(data)
        .filter(([key]) => key !== 'type')
        .map(([category, symbols]) => (
          <div key={category}>
            <h4 className="text-gray-400 text-xs font-medium mb-2">{category}</h4>
            <div className="flex flex-wrap gap-1">
              {Array.from(symbols).map((char, i) => (
                <button
                  key={`${char}-${i}`}
                  onClick={() => handleCopy(char)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface hover:bg-white/10 text-lg transition-all hover:scale-110 active:scale-95 relative group font-['Segoe_UI_Emoji','Apple_Color_Emoji','Noto_Color_Emoji','sans-serif']"
                  title="点击复制"
                >
                  {char}
                  {copiedEmoji === char && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 animate-fade-in">
                      已复制
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function SizeTableDisplay({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-5">
      {Object.entries(data)
        .filter(([key]) => key !== 'type')
        .map(([title, content]) => {
          const lines = content.split('\n');

          if (title.startsWith('💡')) {
            return (
              <div key={title} className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 text-sm">💡</span>
                  <div className="space-y-1">
                    {lines.map((line, i) => (
                      <p key={i} className="text-amber-300/70 text-xs">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          const hasTab = lines.some(l => l.includes('\t'));
          if (!hasTab) {
            return (
              <div key={title}>
                <h4 className="text-white text-sm font-medium mb-2">{title}</h4>
                <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-2">
                  {lines.map((line, i) => (
                    <p key={i} className="text-gray-300 text-xs">{line}</p>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={title}>
              <h4 className="text-white text-sm font-medium mb-2">{title}</h4>
              <div className="bg-surface rounded-xl overflow-hidden border border-white/5">
                <table className="w-full text-xs">
                  <tbody>
                    {lines.map((line, i) => {
                      const cells = line.split('\t');
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                          {cells.map((cell, j) => (
                            <td
                              key={j}
                              className={`px-3 py-2.5 ${j === 0 ? 'text-gray-400 font-medium' : 'text-white text-center'} ${j < cells.length - 1 ? 'border-r border-white/5' : ''}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </div>
  );
}