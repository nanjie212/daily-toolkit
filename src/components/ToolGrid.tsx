import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  SparklesIcon,
  FileImageIcon,
  RefreshCwIcon,
  MaximizeIcon,
  BracesIcon,
  LinkIcon,
  RegexIcon,
  ShieldCheckIcon,
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
  DivideIcon,
  DogIcon,
  PercentIcon,
  ShirtIcon,
  CalendarHeartIcon,
  BanknoteIcon,
  GiftIcon,
  TrendingUpIcon,
  CarIcon,
  UtensilsCrossedIcon,
  BabyIcon,
  ActivityIcon,
  FlameIcon,
  HeartPulseIcon,
  CalendarDaysIcon,
  MoonIcon,
  HeartIcon,
  IdCardIcon,
  PhoneIcon,
  TypeIcon,
  BookOpenIcon,
  ListFilterIcon,
  SunMoonIcon,
  FlipHorizontal2Icon,
  SquareDashedIcon,
  SlidersHorizontalIcon,
  SmilePlusIcon,
  UsersIcon,
  MessageCircleIcon,
  ImagePlayIcon,
  DollarSignIcon,
  SmileIcon,
  HomeIcon,
  ReceiptIcon,
  DicesIcon,
  GlobeIcon,
  CreditCardIcon,
  CarTaxiFront,
  UserIcon,
  StampIcon,
  EraserIcon,
  RowsIcon,
  ScanTextIcon,
  TypeOutline,
  PinIcon,
  PinOffIcon,
  TrendingDownIcon,
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
  BracesIcon,
  LinkIcon,
  RegexIcon,
  ShieldCheckIcon,
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
  DivideIcon,
  DogIcon,
  PercentIcon,
  ShirtIcon,
  CalendarHeartIcon,
  BanknoteIcon,
  GiftIcon,
  TrendingUpIcon,
  CarIcon,
  UtensilsCrossedIcon,
  BabyIcon,
  ActivityIcon,
  FlameIcon,
  HeartPulseIcon,
  CalendarDaysIcon,
  MoonIcon,
  HeartIcon,
  IdCardIcon,
  PhoneIcon,
  TypeIcon,
  BookOpenIcon,
  ListFilterIcon,
  SunMoonIcon,
  FlipHorizontal2Icon,
  SquareDashedIcon,
  SlidersHorizontalIcon,
  SmilePlusIcon,
  UsersIcon,
  MessageCircleIcon,
  ImagePlayIcon,
  DollarSignIcon,
  SmileIcon,
  HomeIcon,
  ReceiptIcon,
  DicesIcon,
  GlobeIcon,
  CreditCardIcon,
  CarTaxiFrontIcon: CarTaxiFront,
  UserIcon,
  StampIcon,
  EraserIcon,
  RowsIcon,
  ScanTextIcon,
  TypeOutlineIcon: TypeOutline,
};

const categoryColors: Record<string, string> = {
  everyday: 'from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/40',
  finance: 'from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/40',
  health: 'from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/40',
  image: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/40',
  fun: 'from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/40',
};

interface ToolGridProps {
  tools: ToolRecord[];
}

interface ToolPreviewData {
  tool: ToolRecord;
  position: { x: number; y: number };
}

export default function ToolGrid({ tools }: ToolGridProps) {
  const navigate = useNavigate();
  const { favoriteToolIds, toggleFavorite, pinnedToolIds, togglePinned } = useStore();
  const [preview, setPreview] = useState<ToolPreviewData | null>(null);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (tool: ToolRecord, event: React.MouseEvent) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      setPreview({
        tool,
        position: {
          x: rect.left,
          y: rect.top,
        },
      });
      setHoveredTool(tool.id);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    setPreview(null);
    setHoveredTool(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (preview) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPreview({
        ...preview,
        position: {
          x: rect.left,
          y: rect.top,
        },
      });
    }
  };

  const handleToolClick = (tool: ToolRecord) => {
    navigate(`/tool/${tool.id}`);
  };

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <SparklesIcon className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">没有找到匹配的工具</p>
        <p className="text-sm mt-2">尝试其他关键词或分类</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 工具图标网格 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 p-4">
        {tools.map((tool, index) => {
          const Icon = iconMap[tool.icon] || SparklesIcon;
          const isFavorite = favoriteToolIds.includes(tool.id);
          const isPinned = pinnedToolIds.includes(tool.id);
          const isHovered = hoveredTool === tool.id;
          
          return (
            <div
              key={tool.id}
              className="relative group"
              onMouseEnter={(e) => handleMouseEnter(tool, e)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
            >
              <button
                onClick={() => handleToolClick(tool)}
                className={`
                  relative w-full aspect-square rounded-2xl flex flex-col items-center justify-center
                  transition-all duration-300 cursor-pointer
                  bg-gradient-to-br ${categoryColors[tool.category] || categoryColors.everyday}
                  border border-white/5 hover:border-accent/50
                  ${isHovered ? 'scale-110 shadow-lg shadow-accent/20 ring-2 ring-accent/50' : 'hover:scale-105'}
                `}
              >
                <Icon className="w-7 h-7 text-white/90" />
                <span className="text-[10px] text-white/70 mt-1 text-center leading-tight px-1 line-clamp-2">
                  {tool.name}
                </span>
                
                {/* 收藏标记 */}
                {isFavorite && (
                  <div className="absolute top-1 right-1">
                    <StarIcon className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </div>
                )}
                
                {/* 固定标记 */}
                {isPinned && (
                  <div className="absolute top-1 left-1">
                    <PinIcon className="w-3 h-3 text-accent" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 悬停预览弹窗 */}
      {preview && (
        <ToolPreviewCard
          tool={preview.tool}
          position={preview.position}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

interface ToolPreviewCardProps {
  tool: ToolRecord;
  position: { x: number; y: number };
  onClose: () => void;
}

function ToolPreviewCard({ tool, position, onClose }: ToolPreviewCardProps) {
  const navigate = useNavigate();
  const { favoriteToolIds, toggleFavorite, pinnedToolIds, togglePinned } = useStore();
  const Icon = iconMap[tool.icon] || SparklesIcon;
  const isFavorite = favoriteToolIds.includes(tool.id);
  const isPinned = pinnedToolIds.includes(tool.id);
  
  // 计算弹窗位置
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = 320;
  const cardHeight = 280;
  
  let left = position.x;
  let top = position.y + 70; // 图标下方
  
  // 右侧超出
  if (left + cardWidth > viewportWidth - 20) {
    left = Math.max(20, viewportWidth - cardWidth - 20);
  }
  
  // 下方超出
  if (top + cardHeight > viewportHeight - 20) {
    top = position.y - cardHeight - 10; // 显示在图标上方
  }
  
  return (
    <div
      className="fixed z-50 animate-fade-in"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${cardWidth}px`,
      }}
    >
      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-white font-heading font-semibold">{tool.name}</h3>
                <p className="text-xs text-gray-500">v{tool.version}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-300 line-clamp-2">
            {tool.description}
          </p>
          
          {tool.tips && (
            <div className="flex items-start gap-2 p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
              <LightbulbIcon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300/80">{tool.tips}</p>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                navigate(`/tool/${tool.id}`);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors flex items-center justify-center gap-2"
            >
              打开工具
            </button>
            <button
              onClick={() => toggleFavorite(tool.id)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              title={isFavorite ? '取消收藏' : '收藏'}
            >
              <StarIcon className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => togglePinned(tool.id)}
              className={`p-2 rounded-lg transition-colors ${
                isPinned
                  ? 'bg-accent/20 text-accent'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              title={isPinned ? '取消固定' : '固定到顶部'}
            >
              {isPinned ? <PinOffIcon className="w-4 h-4" /> : <PinIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* 底部提示 */}
        <div className="px-4 py-2 bg-black/20 text-xs text-gray-500">
          点击打开工具 · 鼠标悬停预览详情
        </div>
      </div>
      
      {/* 指向箭头的三角 */}
      <div
        className="absolute w-0 h-0"
        style={{
          left: position.x + 40,
          top: position.y + 60,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid rgba(255, 255, 255, 0.1)',
          transform: 'translateY(-100%)',
        }}
      />
    </div>
  );
}
