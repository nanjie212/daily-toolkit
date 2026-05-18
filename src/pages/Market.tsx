import { useState } from 'react';
import { SearchIcon, DownloadIcon, TrashIcon } from 'lucide-react';
import { useStore } from '@/store';
import { categories } from '@/tools/categories';
import { saveCustomTool, removeCustomTool } from '@/engine/ToolLoader';
import type { ToolRecord } from '@/types';
import ToolCard from '@/components/ToolCard';

export default function Market() {
  const { tools, reloadTools } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  const communityTools: ToolRecord[] = [
    {
      id: 'csv-to-json',
      name: 'CSV转JSON',
      description: '将CSV格式数据转换为JSON格式',
      category: 'dev',
      icon: 'BracesIcon',
      version: '1.0.0',
      source: 'community',
      permissions: [],
      inputSchema: [
        { key: 'csv', label: 'CSV数据', type: 'textarea', placeholder: '粘贴CSV数据...', required: true },
      ],
      outputFormat: 'text',
    },
    {
      id: 'color-picker',
      name: '颜色选择器',
      description: '选择颜色并获取HEX、RGB、HSL格式',
      category: 'dev',
      icon: 'CodeIcon',
      version: '1.0.0',
      source: 'community',
      permissions: [],
      inputSchema: [
        { key: 'color', label: '选择颜色', type: 'color', defaultValue: '#00E5A0' },
      ],
      outputFormat: 'json',
    },
    {
      id: 'lorem-generator',
      name: '占位文本生成',
      description: '生成Lorem Ipsum占位文本',
      category: 'text',
      icon: 'FileTextIcon',
      version: '1.0.0',
      source: 'community',
      permissions: [],
      inputSchema: [
        { key: 'paragraphs', label: '段落数', type: 'number', defaultValue: 3, placeholder: '1-20' },
      ],
      outputFormat: 'text',
    },
  ];

  const allMarketTools = communityTools;

  const filteredTools = allMarketTools.filter((tool) => {
    const matchCategory = !selectedCategory || tool.category === selectedCategory;
    const matchSearch = !searchQuery ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const isInstalled = (id: string) => tools.some((t) => t.id === id);

  const handleInstall = (tool: ToolRecord) => {
    setInstalling(tool.id);
    setTimeout(() => {
      saveCustomTool(tool);
      reloadTools();
      setInstalling(null);
    }, 500);
  };

  const handleUninstall = (id: string) => {
    removeCustomTool(id);
    reloadTools();
  };

  return (
    <div className="min-h-full p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">工具市场</h1>
        <p className="text-gray-400">发现和安装社区工具，扩展你的工具箱</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索社区工具..."
            className="w-full pl-12 pr-4 py-3 bg-glass border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all backdrop-blur-xl"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !selectedCategory
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-surface text-gray-400 border border-white/5 hover:text-white'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-surface text-gray-400 border border-white/5 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const installed = isInstalled(tool.id);
            return (
              <div key={tool.id} className="bg-card border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-accent/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-heading font-semibold">{tool.name}</h3>
                    <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                      社区
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">{tool.description}</p>
                <div className="flex items-center gap-2">
                  {installed ? (
                    <>
                      <span className="text-xs text-accent">已安装</span>
                      <button
                        onClick={() => handleUninstall(tool.id)}
                        className="ml-auto px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="w-3 h-3" />
                        卸载
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInstall(tool)}
                      disabled={installing === tool.id}
                      className="ml-auto px-3 py-1.5 text-xs text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <DownloadIcon className="w-3 h-3" />
                      {installing === tool.id ? '安装中...' : '安装'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">没有找到社区工具</p>
          <p className="text-sm mt-2">敬请期待更多工具上架</p>
        </div>
      )}

      <div>
        <h2 className="text-white font-heading font-bold text-xl mb-4">已安装的自定义工具</h2>
        {tools.filter((t) => t.source === 'custom').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tools
              .filter((t) => t.source === 'custom')
              .map((tool) => (
                <div key={tool.id} className="relative">
                  <ToolCard tool={tool} />
                  <button
                    onClick={() => handleUninstall(tool.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    title="卸载"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">暂无已安装的自定义工具</p>
        )}
      </div>
    </div>
  );
}
