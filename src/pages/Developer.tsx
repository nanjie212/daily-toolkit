import { useState } from 'react';
import { ArrowLeftIcon, BookIcon, CodeIcon, FlaskConicalIcon, PlayIcon, CopyIcon, CheckIcon } from 'lucide-react';
import AIPromptGenerator from '@/components/AIPromptGenerator';

export default function Developer() {
  const [activeTab, setActiveTab] = useState<'sdk' | 'wizard' | 'sandbox'>('sdk');
  const [sandboxCode, setSandboxCode] = useState(`// 在此编写测试代码
function greet(name) {
  return "你好, " + name + "!";
}

const result = greet("ToolBox");
console.log(result);`);
  const [sandboxOutput, setSandboxOutput] = useState('');
  const [sandboxError, setSandboxError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSandbox = () => {
    setSandboxOutput('');
    setSandboxError('');
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      };

      const fn = new Function(sandboxCode);
      const result = fn();
      if (result !== undefined) {
        logs.push(`返回值: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
      }

      console.log = originalLog;
      setSandboxOutput(logs.join('\n') || '执行成功，无输出');
    } catch (e) {
      setSandboxError((e as Error).message);
    }
  };

  const tabs = [
    { id: 'sdk' as const, label: 'SDK文档', icon: BookIcon },
    { id: 'wizard' as const, label: '创建向导', icon: CodeIcon },
    { id: 'sandbox' as const, label: '沙盒测试', icon: FlaskConicalIcon },
  ];

  return (
    <div className="min-h-full p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            aria-label="返回"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">开发者中心</h1>
            <p className="text-gray-400">创建、测试和发布你的自定义工具</p>
          </div>
        </div>

      <div className="flex gap-2 border-b border-white/5 pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-accent border-accent'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'sdk' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-white font-heading font-bold text-xl mb-3">工具定义接口</h2>
              <p className="text-gray-400 text-sm mb-3">
                每个工具需要实现 ToolDefinition 接口，定义工具的基本信息和输入输出格式。
              </p>
              <div className="relative">
                <button
                  onClick={() => handleCopy(`interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  source: 'builtin' | 'community' | 'custom';
  permissions: string[];
  inputSchema: InputField[];
  outputFormat: string;
}`)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all z-10"
                >
                  {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                </button>
                <pre className="bg-surface rounded-xl p-4 text-sm text-gray-300 overflow-x-auto">
{`interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  source: 'builtin' | 'community' | 'custom';
  permissions: string[];
  inputSchema: InputField[];
  outputFormat: string;
}`}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-white font-heading font-bold text-xl mb-3">输入字段定义</h2>
              <p className="text-gray-400 text-sm mb-3">
                支持多种输入类型：text、textarea、file、select、number、checkbox、color
              </p>
              <pre className="bg-surface rounded-xl p-4 text-sm text-gray-300 overflow-x-auto">
{`interface InputField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'select' | 'number' | 'checkbox' | 'color';
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  accept?: string;
}`}
              </pre>
            </div>

            <div>
              <h2 className="text-white font-heading font-bold text-xl mb-3">输出格式</h2>
              <p className="text-gray-400 text-sm mb-3">
                工具执行结果遵循统一的 ToolOutput 接口。
              </p>
              <pre className="bg-surface rounded-xl p-4 text-sm text-gray-300 overflow-x-auto">
{`interface ToolOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  downloadUrl?: string;
  filename?: string;
}`}
              </pre>
            </div>

            <div>
              <h2 className="text-white font-heading font-bold text-xl mb-3">快速开始</h2>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center">1</span>
                  <div>
                    <h3 className="text-white font-medium text-sm">定义工具</h3>
                    <p className="text-gray-500 text-sm">创建 tool.json 配置文件，定义工具的元信息和输入参数</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center">2</span>
                  <div>
                    <h3 className="text-white font-medium text-sm">实现逻辑</h3>
                    <p className="text-gray-500 text-sm">编写 onExecute 函数，处理输入并返回 ToolOutput</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center">3</span>
                  <div>
                    <h3 className="text-white font-medium text-sm">注册工具</h3>
                    <p className="text-gray-500 text-sm">在 ToolExecutor 中注册执行器，在工具注册表中导入</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center">4</span>
                  <div>
                    <h3 className="text-white font-medium text-sm">测试发布</h3>
                    <p className="text-gray-500 text-sm">使用沙盒测试工具，确认无误后发布到工具市场</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wizard' && (
        <div className="animate-fade-in">
          <div className="bg-card border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-heading font-bold text-xl mb-4">AI提示词生成器</h2>
            <p className="text-gray-400 text-sm mb-6">
              描述你想要的工具，AI将为你生成提示词模板和一键集成代码
            </p>
            <AIPromptGenerator />
          </div>
        </div>
      )}

      {activeTab === 'sandbox' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-card border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-heading font-bold text-xl">沙盒测试</h2>
              <button
                onClick={handleRunSandbox}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                运行
              </button>
            </div>
            <textarea
              value={sandboxCode}
              onChange={(e) => setSandboxCode(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all resize-y min-h-[300px]"
              spellCheck={false}
            />
          </div>

          {(sandboxOutput || sandboxError) && (
            <div className={`rounded-2xl p-6 ${
              sandboxError ? 'bg-red-500/10 border border-red-500/20' : 'bg-card border border-white/5'
            }`}>
              <h3 className={`font-medium mb-2 ${sandboxError ? 'text-red-400' : 'text-white'}`}>
                {sandboxError ? '错误' : '输出'}
              </h3>
              <pre className="text-sm whitespace-pre-wrap break-all font-mono text-gray-300">
                {sandboxError || sandboxOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
