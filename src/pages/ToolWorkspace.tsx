import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, InfoIcon, RotateCcwIcon } from 'lucide-react';
import { useStore } from '@/store';
import { executeTool } from '@/engine/ToolExecutor';
import DynamicForm from '@/components/DynamicForm';
import OutputPanel from '@/components/OutputPanel';
import OutputModal from '@/components/OutputModal';
import ToolFeedback from '@/components/ToolFeedback';
import CalculatorUI from '@/components/CalculatorUI';
import PomodoroTimerUI from '@/components/PomodoroTimerUI';
import StopwatchUI from '@/components/StopwatchUI';
import InteractiveImageEditor from '@/components/InteractiveImageEditor';
import KinshipCalculator from '@/components/KinshipCalculator';
import IdiomChainGame from '@/components/IdiomChainGame';
import EnhancedBackgroundRemover from '@/components/EnhancedBackgroundRemover';
import EnhancedPhotoRestorer from '@/components/EnhancedPhotoRestorer';
import type { ToolOutput } from '@/types';

export default function ToolWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tools, selectTool, setDetailOpen, updateRecentUse } = useStore();
  const [output, setOutput] = useState<ToolOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMobileOutput, setShowMobileOutput] = useState(false);
  const [kinshipPath, setKinshipPath] = useState('');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const tool = tools.find((t) => t.id === id);

  const hasAutoExecutedRef = useRef(false);

  useEffect(() => {
    if (tool && !hasAutoExecutedRef.current) {
      const inputSchema = tool.inputSchema;
      const hasRequired = inputSchema.some(f => f.required);
      const hasNoInput = inputSchema.length === 0;

      if (!hasRequired || hasNoInput) {
        hasAutoExecutedRef.current = true;
        executeTool(tool.id, {}).then(result => {
          setOutput(result);
          updateRecentUse(tool.id);
        }).catch(() => {
          setOutput({ success: false, error: '获取数据失败' });
        });
      }
    }
  }, [tool]);

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-lg">工具未找到</p>
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] px-4 py-2 bg-accent/20 text-accent rounded-xl hover:bg-accent/30 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (tool.id === 'simple-calculator') {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <CalculatorUI onResult={() => {}} />
        </div>
      </div>
    );
  }

  if (tool.id === 'pomodoro-timer') {
    const workField = tool.inputSchema.find((f) => f.key === 'workMinutes');
    const breakField = tool.inputSchema.find((f) => f.key === 'breakMinutes');
    const roundsField = tool.inputSchema.find((f) => f.key === 'rounds');
    const workMinutes = Number(workField?.defaultValue ?? 25);
    const breakMinutes = Number(breakField?.defaultValue ?? 5);
    const rounds = Number(roundsField?.defaultValue ?? 4);

    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <PomodoroTimerUI workMinutes={workMinutes} breakMinutes={breakMinutes} rounds={rounds} />
        </div>
      </div>
    );
  }

  if (tool.id === 'stopwatch') {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <StopwatchUI />
        </div>
      </div>
    );
  }

  // 成语接龙 - 使用专用游戏组件
  if (tool.id === 'idiom-chain') {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <IdiomChainGame />
      </div>
    );
  }

  // AI抠图 - 使用增强版组件
  if (tool.id === 'ai-background-remove') {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <EnhancedBackgroundRemover />
      </div>
    );
  }

  // 老照片修复 - 使用增强版组件
  if (tool.id === 'photo-restore') {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <EnhancedPhotoRestorer />
      </div>
    );
  }

  if (tool.id === 'screenshot-annotate') {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <InteractiveImageEditor />
      </div>
    );
  }

  if (tool.id === 'kinship-calculator') {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-surface text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
        </div>
        <KinshipCalculator
          onPathChange={(path) => {
            setKinshipPath(path);
          }}
          onExecute={() => {
            if (!kinshipPath) return;
            executeTool(tool.id, { path: kinshipPath }).then((result) => {
              setOutput(result);
              updateRecentUse(tool.id);
            }).catch(() => {
              setOutput({ success: false, error: '计算失败' });
            });
          }}
        />
        <div className="mt-4">
          <OutputPanel output={output} />
        </div>
      </div>
    );
  }

  const handleExecute = async (values: Record<string, unknown>) => {
    setLoading(true);
    setOutput(null);
    try {
      const result = await executeTool(tool.id, values);
      setOutput(result);
      if (isMobile) setShowMobileOutput(true);
      updateRecentUse(tool.id);
    } catch {
      setOutput({ success: false, error: '执行出错' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOutput(null);
  };

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            aria-label="返回首页"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tool.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            aria-label="重置"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="重置"
          >
            <RotateCcwIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              selectTool(tool);
              setDetailOpen(true);
            }}
            aria-label="工具信息"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-gray-400 hover:text-accent hover:bg-accent/10 transition-all"
            title="详情"
          >
            <InfoIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-heading font-semibold text-lg mb-4">输入参数</h2>
          <DynamicForm schema={tool.inputSchema} onSubmit={handleExecute} loading={loading} />
        </div>

        <div>
          {output ? (
            <OutputPanel output={output} />
          ) : (
            <div className="bg-card border border-white/5 rounded-2xl p-8 min-h-[300px] flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <InfoIcon className="w-7 h-7 text-gray-600" />
              </div>
              {tool.tips && (
                <div className="mb-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <p className="text-amber-300/80 text-sm flex items-start gap-2">
                    <span className="text-amber-400 text-xs mt-0.5">💡</span>
                    <span>{tool.tips}</span>
                  </p>
                </div>
              )}
              <h3 className="text-white text-sm font-medium mb-3">使用步骤</h3>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-accent font-bold text-xs mt-0.5">1.</span>
                  <span>填写或选择左侧的输入参数</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold text-xs mt-0.5">2.</span>
                  <span>点击「执行」按钮开始处理</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold text-xs mt-0.5">3.</span>
                  <span>查看结果，支持复制或下载</span>
                </li>
              </ol>
            </div>
          )}
          <ToolFeedback toolId={tool.id} />
        </div>
      </div>

      {showMobileOutput && output && (
        <OutputModal
          output={output}
          onClose={() => setShowMobileOutput(false)}
        />
      )}
    </div>
  );
}
