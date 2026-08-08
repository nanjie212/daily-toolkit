import { XIcon, StarIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useStore } from '@/store';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export default function ToolDetail() {
  const { selectedTool, detailOpen, setDetailOpen, favoriteToolIds, toggleFavorite } = useStore();
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedEntry, setCopiedEntry] = useState(false);
  const titleId = useId();
  const isFavorite = selectedTool ? favoriteToolIds.includes(selectedTool.id) : false;

  // Esc 关闭 + Tab 焦点循环 + 关闭后焦点归位（hook 必须在提前 return 之前调用）
  const drawerRef = useFocusTrap<HTMLDivElement>({
    active: detailOpen && !!selectedTool,
    onEscape: () => setDetailOpen(false),
  });

  if (!detailOpen || !selectedTool) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(toolJson).catch(() => {});
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyEntry = () => {
    navigator.clipboard.writeText(entryCode).catch(() => {});
    setCopiedEntry(true);
    setTimeout(() => setCopiedEntry(false), 2000);
  };

  const toolJson = JSON.stringify(
    {
      id: selectedTool.id,
      name: selectedTool.name,
      description: selectedTool.description,
      category: selectedTool.category,
      version: selectedTool.version,
      inputSchema: selectedTool.inputSchema,
      outputFormat: selectedTool.outputFormat,
    },
    null,
    2
  );

  const entryCode = `export async function onExecute(input) {
  // 在此实现工具逻辑
  const result = processInput(input);
  return {
    success: true,
    data: result
  };
}`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setDetailOpen(false)}
        role="presentation"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed right-0 top-0 h-full w-96 bg-card border-l border-white/5 z-50 flex flex-col animate-slide-in-right"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 id={titleId} className="font-heading font-bold text-white text-lg">
            工具详情
          </h2>
          <button
            onClick={() => setDetailOpen(false)}
            aria-label="关闭工具详情"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-heading font-bold text-white text-xl">{selectedTool.name}</h3>
              <button
                onClick={() => toggleFavorite(selectedTool.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isFavorite ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'
                }`}
              >
                <StarIcon className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="text-gray-400 text-sm">{selectedTool.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">版本</div>
              <div className="text-white text-sm font-medium">v{selectedTool.version}</div>
            </div>
            <div className="bg-surface rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">来源</div>
              <div className="text-white text-sm font-medium">
                {selectedTool.source === 'builtin' ? '内置' : selectedTool.source === 'community' ? '社区' : '自定义'}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-3">输入参数</h4>
            <div className="space-y-2">
              {selectedTool.inputSchema.map((field) => (
                <div key={field.key} className="bg-surface rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{field.label}</span>
                    <span className="text-xs text-gray-500">{field.type}</span>
                  </div>
                  {field.required && (
                    <span className="text-xs text-red-400">必填</span>
                  )}
                  {field.placeholder && (
                    <p className="text-xs text-gray-600 mt-1">{field.placeholder}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-3">一键集成</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">tool.json</span>
                  <button
                    onClick={handleCopyJson}
                    className="p-1 rounded text-gray-500 hover:text-accent transition-colors"
                  >
                    {copiedJson ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-surface rounded-xl p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                  {toolJson}
                </pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">执行入口</span>
                  <button
                    onClick={handleCopyEntry}
                    className="p-1 rounded text-gray-500 hover:text-accent transition-colors"
                  >
                    {copiedEntry ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-surface rounded-xl p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                  {entryCode}
                </pre>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-3">集成步骤</h4>
            <ol className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-accent font-bold">1.</span>
                <span>复制 tool.json 配置到项目目录</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-bold">2.</span>
                <span>实现 onExecute 函数处理输入数据</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-bold">3.</span>
                <span>在工具注册表中注册新工具</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-bold">4.</span>
                <span>测试工具执行并验证输出</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
