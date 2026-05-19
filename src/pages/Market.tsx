import { useState, useMemo } from 'react';
import { SearchIcon, DownloadIcon, TrashIcon, TrendingUpIcon, SparklesIcon } from 'lucide-react';
import { useStore } from '@/store';
import { saveCustomTool, removeCustomTool } from '@/engine/ToolLoader';
import type { ToolRecord } from '@/types';

const marketTools: ToolRecord[] = [
  {
    id: 'text-counter', name: '文本统计', description: '自动统计字符数、词数、行数和段落数',
    category: 'market', icon: 'FileTextIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文本', type: 'textarea', placeholder: '粘贴或输入文本...', required: true },
    ],
    outputFormat: 'text', tips: '支持中英文混合统计',
  },
  {
    id: 'traditional-simplified', name: '繁简转换', description: '繁体简体中文互转，基于OpenCC引擎',
    category: 'market', icon: 'LanguagesIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文字', type: 'textarea', placeholder: '输入要转换的文字...', required: true },
      { key: 'mode', label: '转换方向', type: 'select', defaultValue: 't2s', options: [{ label: '繁体→简体', value: 't2s' }, { label: '简体→繁体', value: 's2t' }] },
    ],
    outputFormat: 'text', tips: '基于OpenCC引擎，全字符集覆盖',
  },
  {
    id: 'case-converter', name: '大小写转换', description: '支持大写、小写、首字母大写、句首大写等5种模式',
    category: 'market', icon: 'TypeIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文字', type: 'textarea', placeholder: '输入要转换的文字...', required: true },
      { key: 'mode', label: '转换模式', type: 'select', defaultValue: 'upper', options: [{ label: '全部大写', value: 'upper' }, { label: '全部小写', value: 'lower' }, { label: '首字母大写', value: 'capitalize' }, { label: '反转大小写', value: 'toggle' }] },
    ],
    outputFormat: 'text', tips: '适用于英文文本的快速格式化',
  },
  {
    id: 'text-dedup', name: '文本去重', description: '去除重复行、空白行和排序去重',
    category: 'market', icon: 'ListFilterIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文本', type: 'textarea', placeholder: '每行一条数据...', required: true },
      { key: 'mode', label: '处理方式', type: 'select', defaultValue: 'dedup', options: [{ label: '去重复行', value: 'dedup' }, { label: '删空白行', value: 'removeBlank' }, { label: '排序去重', value: 'sortDedup' }] },
    ],
    outputFormat: 'text', tips: '每行作为独立单元处理',
  },
  {
    id: 'text-summary', name: '文章摘要', description: '本地算法提取关键句，快速了解长文要点',
    category: 'market', icon: 'BookOpenIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文章', type: 'textarea', placeholder: '粘贴文章内容...', required: true },
      { key: 'length', label: '摘要长度', type: 'select', defaultValue: 'medium', options: [{ label: '简短', value: 'short' }, { label: '中等', value: 'medium' }, { label: '详细', value: 'long' }] },
    ],
    outputFormat: 'text', tips: '基于关键词密度抽取关键句',
  },
  {
    id: 'speech-to-text', name: '语音转文字', description: '浏览器语音识别，将你说的话转为文字',
    category: 'market', icon: 'MicIcon', version: '1.0.0', source: 'community', permissions: ['microphone'],
    inputSchema: [
      { key: 'lang', label: '识别语言', type: 'select', defaultValue: 'zh-CN', options: [{ label: '中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }] },
    ],
    outputFormat: 'text', tips: '需浏览器支持Web Speech API，需授权麦克风',
  },
  {
    id: 'text-to-speech', name: '文字转语音', description: '将文字转为语音朗读，调节语速',
    category: 'market', icon: 'Volume2Icon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文字', type: 'textarea', placeholder: '输入要朗读的文字...', required: true },
      { key: 'rate', label: '朗读速度', type: 'select', defaultValue: '1', options: [{ label: '慢速', value: '0.7' }, { label: '正常', value: '1' }, { label: '快速', value: '1.3' }] },
    ],
    outputFormat: 'text', tips: '使用浏览器内置语音合成引擎',
  },
];

type Tab = 'all' | 'installed' | 'hot';

export default function Market() {
  const { tools, reloadTools, toolLikes } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [installing, setInstalling] = useState<string | null>(null);

  const isInstalled = (id: string) => tools.some((t) => t.id === id);

  const installedTools = useMemo(() => marketTools.filter(t => isInstalled(t.id)), [tools]);
  const hotTools = useMemo(() => [...marketTools].sort((a, b) => (toolLikes[b.id] || 0) - (toolLikes[a.id] || 0)), [toolLikes]);

  const filteredTools = useMemo(() => {
    let list: ToolRecord[];
    if (activeTab === 'installed') list = installedTools;
    else if (activeTab === 'hot') list = hotTools;
    else list = marketTools;
    if (searchQuery) list = list.filter(t => t.name.includes(searchQuery) || t.description.includes(searchQuery));
    return list;
  }, [activeTab, searchQuery, installedTools, hotTools]);

  const handleInstall = (tool: ToolRecord) => {
    setInstalling(tool.id);
    setTimeout(() => {
      saveCustomTool({ ...tool, source: 'custom' as const, category: 'market' });
      reloadTools();
      setInstalling(null);
    }, 300);
  };

  const handleUninstall = (id: string) => { removeCustomTool(id); reloadTools(); };

  const tabs: { key: Tab; label: string; icon: typeof SparklesIcon }[] = [
    { key: 'all', label: '全部工具', icon: SparklesIcon },
    { key: 'installed', label: '已安装', icon: DownloadIcon },
    { key: 'hot', label: '热门排行', icon: TrendingUpIcon },
  ];

  return (
    <div className="min-h-full p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">工具市场</h1>
        <p className="text-gray-400">发现更多实用工具，点击安装即可加入你的工具箱</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface text-gray-400 border border-white/5 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索市场工具..."
            className="w-full pl-10 pr-4 py-2.5 bg-glass border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
      </div>

      {installedTools.length > 0 && activeTab === 'all' && !searchQuery && (
        <div className="bg-card border border-green-500/10 rounded-2xl p-5">
          <h2 className="text-white font-heading font-semibold mb-3 flex items-center gap-2">
            <DownloadIcon className="w-4 h-4 text-green-400" />
            已安装 ({installedTools.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {installedTools.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-surface rounded-xl p-3">
                <div>
                  <span className="text-white text-sm font-medium">{t.name}</span>
                  <p className="text-gray-500 text-xs">{t.description}</p>
                </div>
                <button
                  onClick={() => handleUninstall(t.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  title="卸载"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const installed = isInstalled(tool.id);
            const likes = toolLikes[tool.id] || 0;
            return (
              <div key={tool.id} className="bg-card border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-accent/30 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-heading font-semibold">{tool.name}</h3>
                    <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">社区</span>
                    {likes > 0 && (
                      <span className="text-xs text-amber-400 ml-2">{likes} 赞</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{tool.description}</p>
                {tool.tips && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-1">{tool.tips}</p>
                )}
                <div className="flex items-center gap-2">
                  {installed ? (
                    <>
                      <span className="text-xs text-accent">✓ 已安装</span>
                      <button
                        onClick={() => handleUninstall(tool.id)}
                        className="ml-auto px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="w-3 h-3" />卸载
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInstall(tool)}
                      disabled={installing === tool.id}
                      className="ml-auto px-4 py-2 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 group-hover:bg-accent/15"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      {installing === tool.id ? '安装中...' : '安装'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">{activeTab === 'installed' ? '还没有安装任何市场工具' : '没有找到匹配的工具'}</p>
          <p className="text-sm mt-2">{activeTab === 'installed' ? '浏览全部工具并点击安装来扩充你的工具箱' : '试试更换搜索词或筛选条件'}</p>
        </div>
      )}

      <div className="bg-card border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-heading font-bold text-lg mb-2">📦 想上架你的工具？</h2>
        <p className="text-gray-500 text-sm mb-4">前往开发者中心获取工具上架模板，只需3步即可将你的工具发布到市场</p>
        <button onClick={() => window.location.hash = '#/developer'} className="px-4 py-2 bg-accent/10 text-accent rounded-xl text-sm font-medium hover:bg-accent/20 transition-colors">
          前往开发者中心
        </button>
      </div>
    </div>
  );
}