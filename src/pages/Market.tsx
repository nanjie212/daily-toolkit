import { useState, useMemo } from 'react';
import { SearchIcon, DownloadIcon, TrashIcon, TrendingUpIcon, SparklesIcon } from 'lucide-react';
import { useStore } from '@/store';
import { saveCustomTool, removeCustomTool } from '@/engine/ToolLoader';
import type { ToolRecord } from '@/types';

const marketTools: ToolRecord[] = [
  {
    id: 'base64-encode', name: 'Base64 编解码', description: 'Base64编码解码，支持中英文和特殊字符',
    category: 'market', icon: 'FileCodeIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文本', type: 'textarea', placeholder: '输入要编码或解码的文本...', required: true },
      { key: 'mode', label: '操作模式', type: 'select', defaultValue: 'encode', options: [{ label: '编码 (文字→Base64)', value: 'encode' }, { label: '解码 (Base64→文字)', value: 'decode' }] },
    ],
    outputFormat: 'text', tips: 'Base64编码不是加密，可被直接解码还原原文',
  },
  {
    id: 'id-card-parser', name: '身份证解析', description: '解析中国身份证号，提取地区、生日、性别并校验真伪',
    category: 'market', icon: 'IdCardIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'idNumber', label: '身份证号', type: 'text', placeholder: '请输入18位身份证号...', required: true },
    ],
    outputFormat: 'text', tips: '输入18位身份证号，自动解析地区、生日、性别并校验',
  },
  {
    id: 'number-to-chinese', name: '数字转中文', description: '将阿拉伯数字转换为中文小写或大写金额',
    category: 'market', icon: 'TypeIcon', version: '1.0.0', source: 'community', permissions: [],
    inputSchema: [
      { key: 'num', label: '数字', type: 'text', placeholder: '输入数字...', required: true },
      { key: 'mode', label: '格式', type: 'select', defaultValue: 'lower', options: [{ label: '小写数字', value: 'lower' }, { label: '大写金额', value: 'upper' }] },
    ],
    outputFormat: 'text', tips: '支持整数和小数，大写模式可用于发票金额',
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