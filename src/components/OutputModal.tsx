import { XIcon } from 'lucide-react';
import type { ToolOutput } from '@/types';

interface OutputModalProps {
  output: ToolOutput;
  onClose: () => void;
}

export default function OutputModal({ output, onClose }: OutputModalProps) {
  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-[10%] bg-card border-t border-white/10 rounded-t-3xl animate-slide-up overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <h3 className="text-white font-heading font-semibold text-base">执行结果</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <OutputModalContent output={output} />
        </div>
      </div>
    </div>
  );
}

function OutputModalContent({ output }: { output: ToolOutput }) {
  if (!output.success) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
        <p className="text-red-300/80 text-sm">{output.error}</p>
      </div>
    );
  }

  if (output.type === 'html' && typeof output.data === 'string') {
    return (
      <div className="w-full" style={{ height: '70vh' }}>
        <iframe
          srcDoc={output.data}
          className="w-full h-full border-0 rounded-xl"
          sandbox="allow-scripts allow-same-origin allow-popups"
          title="tool-output-html"
        />
      </div>
    );
  }

  if (typeof output.data === 'string' && output.data.startsWith('data:image')) {
    return (
      <div className="flex justify-center">
        <img src={output.data} alt="输出图片" className="max-w-full max-h-[70vh] rounded-xl" />
      </div>
    );
  }

  if (output.downloadUrl && output.data && typeof output.data === 'object') {
    const data = output.data as Record<string, unknown>;
    return (
      <div className="space-y-4">
        {output.downloadUrl && (
          <div className="flex justify-center mb-4">
            <img src={output.downloadUrl} alt="处理后的图片" className="max-w-full max-h-[40vh] rounded-xl" />
          </div>
        )}
        {Object.entries(data).filter(([k]) => k !== 'type').map(([key, value]) => (
          <div key={key} className="bg-surface rounded-xl px-4 py-3 border border-white/5">
            <span className="text-gray-500 text-xs font-medium">{key}</span>
            <p className="text-white text-sm mt-1">{String(value)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (typeof output.data === 'string') {
    return (
      <div className="bg-surface rounded-xl p-5 border border-white/5">
        <pre className="text-gray-300 text-sm whitespace-pre-wrap break-all font-sans leading-relaxed">
          {output.data}
        </pre>
      </div>
    );
  }

  if (output.data && typeof output.data === 'object') {
    const entries = Object.entries(output.data as Record<string, unknown>).filter(([k]) => k !== 'type');
    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-surface rounded-xl px-4 py-3 border border-white/5">
            <span className="text-gray-500 text-xs font-medium">{key}</span>
            <p className="text-white text-sm mt-1">{String(value)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5 border border-white/5">
      <pre className="text-gray-300 text-sm whitespace-pre-wrap break-all font-mono">
        {JSON.stringify(output.data, null, 2)}
      </pre>
    </div>
  );
}