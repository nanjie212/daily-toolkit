import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompassIcon, HomeIcon } from 'lucide-react';
import { useStore } from '@/store';
import type { ToolRecord } from '@/types';
import { COMMON_TOOL_IDS } from '@/tools/commonTools';
import { getToolIcon } from '@/components/ToolGrid';
import CommandSearch from '@/components/CommandSearch';

/** 404 页推荐的常用工具数量。取 COMMON_TOOL_IDS 的前 N 个，与首屏常用工具保持同一份数据源。 */
const RECOMMEND_LIMIT = 8;

/**
 * 404 兜底页。
 *
 * 挂在 Layout 内的 `path="*"` 路由上，所以顶栏 / 底栏 / 移动端导航都在，
 * 用户不会被丢进一个「什么都没有」的白屏里。
 *
 * 页面只做三件事：
 * 1. 说明这个地址没有对应页面
 * 2. 复用 `CommandSearch` 让用户直接搜工具（搜索词是页面局部状态，不污染首页的全局搜索）
 * 3. 给几个常用工具与「返回首页」两条明确出路
 */
export default function NotFound() {
  const navigate = useNavigate();
  const { tools } = useStore();
  const [query, setQuery] = useState('');

  const recommended: ToolRecord[] = COMMON_TOOL_IDS.slice(0, RECOMMEND_LIMIT)
    .map((id) => tools.find((tool) => tool.id === id))
    .filter(Boolean) as ToolRecord[];

  return (
    <div className="bg-bg min-h-full">
      <section className="px-4 py-14 md:py-20 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-card border border-white/5 flex items-center justify-center">
          <CompassIcon className="w-7 h-7 text-accent" />
        </div>

        <p className="mt-5 text-xs tracking-[0.3em] text-gray-500">404</p>

        <h1 className="mt-2 max-w-[20ch] font-heading font-bold text-white text-[22px] leading-[1.3] sm:text-3xl md:text-4xl tracking-tight">
          这个页面不存在
        </h1>

        <p className="mt-4 max-w-[34ch] text-[13px] md:text-[15px] text-gray-400 leading-relaxed">
          地址可能输错了，也可能这个工具换了名字。直接在下面搜一下，或者回首页看看。
        </p>

        {/* 搜索框：复用首屏同一个组件，输入即出结果，回车直接进工具 */}
        <div className="w-full max-w-[560px] mt-7 md:mt-9">
          <CommandSearch tools={tools} query={query} onQueryChange={setQuery} />
        </div>

        {/* 返回首页 */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <HomeIcon className="w-4 h-4" />
          返回首页
        </button>

        {/* 常用工具推荐：与首屏共用 COMMON_TOOL_IDS，改一处两处同步 */}
        {recommended.length > 0 && (
          <div className="w-full max-w-[760px] mt-11 md:mt-14">
            <p className="text-[11px] md:text-xs text-gray-400 tracking-[0.2em]">常用工具</p>
            <div className="mt-3.5 flex flex-wrap justify-center gap-2 md:gap-2.5">
              {recommended.map((tool) => {
                const Icon = getToolIcon(tool.icon);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => navigate(`/tool/${tool.id}`)}
                    className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-white/5 text-gray-300 hover:text-white hover:border-accent hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4 text-gray-500 group-hover:text-accent transition-colors" />
                    <span className="text-[13px] whitespace-nowrap">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
