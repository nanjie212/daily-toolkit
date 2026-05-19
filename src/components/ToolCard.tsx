import { useNavigate } from 'react-router-dom';
import {
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  SparklesIcon,
  FileImageIcon,
  RefreshCwIcon,
  MaximizeIcon,
  HashIcon,
  BracesIcon,
  BinaryIcon,
  LinkIcon,
  RegexIcon,
  FingerprintIcon,
  ShieldCheckIcon,
  LanguagesIcon,
  QrCodeIcon,
  RulerIcon,
  StarIcon,
  KeyRoundIcon,
  EyeOffIcon,
  CalculatorIcon,
  TimerIcon,
  HourglassIcon,
  FileDownIcon,
  PenToolIcon,
  MicIcon,
  Volume2Icon,
  PenLineIcon,
  ArchiveIcon,
  ArrowLeftRightIcon,
  CropIcon,
  FileStackIcon,
  LightbulbIcon,
} from 'lucide-react';
import type { ToolRecord } from '@/types';
import { useStore } from '@/store';

const iconMap: Record<string, React.ElementType> = {
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  SparklesIcon,
  FileImageIcon,
  RefreshCwIcon,
  MaximizeIcon,
  HashIcon,
  BracesIcon,
  BinaryIcon,
  LinkIcon,
  RegexIcon,
  FingerprintIcon,
  ShieldCheckIcon,
  LanguagesIcon,
  QrCodeIcon,
  RulerIcon,
  KeyRoundIcon,
  EyeOffIcon,
  CalculatorIcon,
  TimerIcon,
  HourglassIcon,
  FileDownIcon,
  PenToolIcon,
  MicIcon,
  Volume2Icon,
  PenLineIcon,
  ArchiveIcon,
  ArrowLeftRightIcon,
  CropIcon,
  FileStackIcon,
  LightbulbIcon,
};

const sourceLabels: Record<string, { label: string; color: string }> = {
  builtin: { label: '内置', color: 'bg-accent/20 text-accent' },
  community: { label: '社区', color: 'bg-purple-500/20 text-purple-400' },
  custom: { label: '自定义', color: 'bg-amber-500/20 text-amber-400' },
};

interface ToolCardProps {
  tool: ToolRecord;
  compact?: boolean;
  index?: number;
}

export default function ToolCard({ tool, compact, index }: ToolCardProps) {
  const navigate = useNavigate();
  const { favoriteToolIds, toggleFavorite } = useStore();
  const isFavorite = favoriteToolIds.includes(tool.id);
  const Icon = iconMap[tool.icon] || SparklesIcon;
  const source = sourceLabels[tool.source] || sourceLabels.builtin;
  const delay = index !== undefined ? index * 50 : 0;

  return (
    <div
      onClick={() => navigate(`/tool/${tool.id}`)}
      role="button"
      aria-label={tool.name}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/tool/${tool.id}`); } }}
      className={`animate-fade-in group relative bg-card border border-white/5 rounded-2xl cursor-pointer transition-all duration-300 hover:border-accent/30 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] min-h-[44px] overflow-hidden ${
        compact ? 'p-4' : 'p-5'
      }`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(tool.id);
        }}
        aria-label={isFavorite ? '取消收藏' : '收藏'}
        className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all duration-200 ${
          isFavorite
            ? 'text-amber-400 bg-amber-400/10'
            : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:bg-amber-400/10'
        }`}
      >
        <StarIcon className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <div className={`rounded-xl bg-accent/10 w-fit flex items-center justify-center mb-3 ${
        compact ? 'p-2' : 'p-3'
      }`}>
        <Icon className={`text-accent ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} role="img" aria-label={tool.name} />
      </div>

      <h3 className={`font-heading font-semibold text-white mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
        {tool.name}
      </h3>

      {!compact && (
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
          {tool.description}
        </p>
      )}

      {tool.tips && !compact && (
        <div className="flex items-start gap-1.5 mb-3">
          <LightbulbIcon className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 line-clamp-1">{tool.tips}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${source.color}`}>
          {source.label}
        </span>
        <span className="text-xs text-gray-600">v{tool.version}</span>
      </div>
    </div>
  );
}
