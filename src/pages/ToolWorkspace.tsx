import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeftIcon, InfoIcon, RotateCcwIcon } from 'lucide-react';
import { useStore } from '@/store';
import { executeTool } from '@/engine/ToolExecutor';
import DynamicForm from '@/components/DynamicForm';
import OutputPanel from '@/components/OutputPanel';
import ToolFeedback from '@/components/ToolFeedback';
import CalculatorUI from '@/components/CalculatorUI';
import PomodoroTimerUI from '@/components/PomodoroTimerUI';
import StopwatchUI from '@/components/StopwatchUI';
import type { ToolOutput } from '@/types';

export default function ToolWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tools, selectTool, setDetailOpen, updateRecentUse } = useStore();
  const [output, setOutput] = useState<ToolOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const tool = tools.find((t) => t.id === id);

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

  const handleExecute = async (values: Record<string, unknown>) => {
    setLoading(true);
    setOutput(null);
    try {
      const result = await executeTool(tool.id, values);
      setOutput(result);
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
            <div className="bg-card border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <InfoIcon className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-sm">填写参数并点击执行查看结果</p>
            </div>
          )}
          <ToolFeedback toolId={tool.id} />
        </div>
      </div>
    </div>
  );
}
