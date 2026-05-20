import { useState, useMemo } from 'react';
import { CopyIcon, CheckIcon, DownloadIcon, AlertCircleIcon } from 'lucide-react';
import type { ToolOutput } from '@/types';

interface OutputPanelProps {
  output: ToolOutput | null;
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
    <div className="animate-success-pulse animate-fade-in bg-card border border-white/5 rounded-2xl overflow-hidden">
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

      <div className="p-5">
        {isImageData ? (
          <div className="flex justify-center">
            <img
              src={output.data as string}
              alt="输出图片"
              className="max-w-full max-h-96 rounded-xl border border-white/10"
            />
          </div>
        ) : isImageOutput ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={output.downloadUrl!}
                alt="处理后的图片"
                className="max-w-full max-h-96 rounded-xl border border-white/10"
              />
            </div>
            {output.data && typeof output.data === 'object' && !(output.data as Record<string, string>)['type'] && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(output.data as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="bg-surface rounded-lg px-3 py-2">
                    <span className="text-gray-400 text-xs">{key}</span>
                    <p className="text-gray-300 text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isEmojiGrid ? (
          <EmojiGridDisplay data={output.data as Record<string, string>} />
        ) : isSizeTable ? (
          <SizeTableDisplay data={output.data as Record<string, string>} />
        ) : isTextData ? (
          <pre className="bg-surface rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap break-all max-h-96 overflow-y-auto font-mono">
            {output.data as string}
          </pre>
        ) : output.data && typeof output.data === 'object' ? (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(output.data as Record<string, unknown>).map(([key, value]) => (
              <div key={key} className="bg-surface rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-all">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{key}</span>
                <p className="text-white text-sm mt-1 font-medium">{String(value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <pre className="bg-surface rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap break-all max-h-96 overflow-y-auto font-mono">
            {JSON.stringify(output.data, null, 2)}
          </pre>
        )}
        {output.提示 && (
          <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertCircleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300/80 text-sm">{output.提示}</p>
          </div>
        )}
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
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface hover:bg-white/10 text-lg transition-all hover:scale-110 active:scale-95 relative group"
                  title="点击复制"
                >
                  {char}
                  {copiedEmoji === char && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
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
