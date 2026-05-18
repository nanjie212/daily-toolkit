import { useState } from 'react';
import { SparklesIcon, CopyIcon, CheckIcon, CodeIcon, FileJsonIcon } from 'lucide-react';

export default function AIPromptGenerator() {
  const [description, setDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [toolJson, setToolJson] = useState('');
  const [entryCode, setEntryCode] = useState('');
  const [showIntegration, setShowIntegration] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!description.trim()) return;

    const toolName = description.slice(0, 20).replace(/\s+/g, '-');
    const prompt = `你是一个工具开发助手。请根据以下描述生成一个ToolBox工具：

工具描述：${description}

请生成：
1. 工具的名称、描述和分类
2. 输入参数定义（inputSchema）
3. 输出格式说明
4. 执行逻辑的伪代码

要求：
- 工具ID使用kebab-case命名
- 输入参数类型支持：text, textarea, file, select, number, checkbox, color
- 输出格式为ToolOutput接口
- 代码使用TypeScript`;

    setGeneratedPrompt(prompt);

    const json = JSON.stringify(
      {
        id: toolName,
        name: description.slice(0, 10),
        description,
        category: 'custom',
        icon: 'CodeIcon',
        version: '1.0.0',
        source: 'custom',
        permissions: [],
        inputSchema: [
          { key: 'input', label: '输入', type: 'textarea', placeholder: '请输入...', required: true },
        ],
        outputFormat: 'text',
      },
      null,
      2
    );
    setToolJson(json);

    const code = `import type { ToolOutput } from '@/types';

export async function execute(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.input as string;
    if (!text) return { success: false, error: '请输入内容' };

    // TODO: 在此实现 ${description.slice(0, 10)} 的核心逻辑
    const result = text;

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}`;
    setEntryCode(code);
    setShowIntegration(false);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          描述你想要的工具
        </label>
        <div className="flex gap-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：一个可以将CSV数据转换为JSON格式的工具..."
            rows={3}
            className="flex-1 px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <SparklesIcon className="w-4 h-4" />
            生成
          </button>
        </div>
      </div>

      {generatedPrompt && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-accent" />
                AI提示词
              </span>
              <button
                onClick={() => handleCopy(generatedPrompt, 'prompt')}
                className="p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all"
              >
                {copied === 'prompt' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              </button>
            </div>
            <pre className="bg-surface rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {generatedPrompt}
            </pre>
          </div>

          <button
            onClick={() => setShowIntegration(!showIntegration)}
            className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CodeIcon className="w-4 h-4" />
            一键集成
          </button>

          {showIntegration && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <FileJsonIcon className="w-4 h-4 text-accent" />
                    tool.json
                  </span>
                  <button
                    onClick={() => handleCopy(toolJson, 'json')}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all"
                  >
                    {copied === 'json' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="bg-surface rounded-xl p-4 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                  {toolJson}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <CodeIcon className="w-4 h-4 text-accent" />
                    执行入口
                  </span>
                  <button
                    onClick={() => handleCopy(entryCode, 'code')}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all"
                  >
                    {copied === 'code' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="bg-surface rounded-xl p-4 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                  {entryCode}
                </pre>
              </div>

              <div className="bg-surface rounded-xl p-4">
                <h4 className="text-white font-medium text-sm mb-3">集成步骤</h4>
                <ol className="space-y-2 text-sm text-gray-400">
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">1.</span>
                    <span>复制 tool.json 配置到 src/tools/ 目录</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">2.</span>
                    <span>在 src/tools/implementations/ 中创建执行文件</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">3.</span>
                    <span>在 ToolExecutor.ts 中注册执行器</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">4.</span>
                    <span>在工具注册表中导入新工具</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">5.</span>
                    <span>测试工具执行并验证输出结果</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
