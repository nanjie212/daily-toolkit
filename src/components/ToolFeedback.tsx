import { useState } from 'react';
import { ThumbsUpIcon, MessageSquareIcon } from 'lucide-react';
import { useStore } from '@/store';

interface ToolFeedbackProps {
  toolId: string;
}

export default function ToolFeedback({ toolId }: ToolFeedbackProps) {
  const { toolLikes, likeTool, toolFeedbacks, addFeedback } = useStore();
  const [showInput, setShowInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const likes = toolLikes[toolId] || 0;
  const feedbacks = toolFeedbacks[toolId] || [];

  const handleSubmit = () => {
    if (!feedbackText.trim()) return;
    addFeedback(toolId, feedbackText.trim());
    setFeedbackText('');
    setShowInput(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => likeTool(toolId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm"
        >
          <ThumbsUpIcon className="w-4 h-4" />
          <span>{likes > 0 ? likes : '有用'}</span>
        </button>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors text-sm"
        >
          <MessageSquareIcon className="w-4 h-4" />
          <span>反馈</span>
        </button>
      </div>
      {showInput && (
        <div className="flex gap-2 animate-fade-in">
          <input
            type="text"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="输入你的建议或反馈..."
            className="flex-1 px-3 py-2 rounded-lg bg-surface border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            提交
          </button>
        </div>
      )}
      {feedbacks.length > 0 && (
        <div className="space-y-1.5">
          {feedbacks.map((fb, i) => (
            <div key={i} className="text-xs text-gray-400 bg-surface/50 px-3 py-2 rounded-lg">
              {fb}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
