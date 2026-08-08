import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import { COMMON_TOOL_IDS } from '@/tools/commonTools';
import { builtInTools } from '@/tools';

/** 与首屏同源的营销腔禁用词，404 页文案同样不允许出现。 */
const BANNED_WORDS = ['赋能', '全能', '强大', '高效生产力', '一站式', '智能平台', '提升效率'];

/**
 * A1 兜底 404 页渲染验证（无需 jsdom）。
 *
 * 该组件被 App 挂在 `path="*"` 上，所以这里单独渲染它来验证内容正确性；
 * 路由接线（catch-all → NotFound）由 App.tsx 源码保证，不在单测里重复覆盖。
 *
 * react-dom/server 只渲染默认态（不执行 effect / 不支持点击），足以验证
 * 文案、常用工具推荐与营销词拦截——交互（返回首页、搜工具）依赖浏览器 API，
 * 由源码静态审查 + 构建产物字符串 grep 覆盖。
 */
function renderNotFound(): string {
  return renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(NotFound)),
  );
}

describe('NotFound (A1 兜底 404 页)', () => {
  const html = renderNotFound();

  it('渲染 404 标题与「这个页面不存在」说明', () => {
    expect(html).toContain('404');
    expect(html).toContain('这个页面不存在');
    expect(html).toContain('地址可能输错了');
  });

  it('提供「返回首页」退路 (navigate 到 /)', () => {
    expect(html).toContain('返回首页');
  });

  it('复用 CommandSearch 搜索框', () => {
    // CommandSearch 内部渲染一个带 combobox 角色的搜索输入
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-label="搜索工具"');
  });

  it('渲染常用工具推荐，且 id 全部真实存在', () => {
    const ids = COMMON_TOOL_IDS.slice(0, 8);
    for (const id of ids) {
      const tool = builtInTools.find((t) => t.id === id);
      expect(tool, `404 推荐工具 ${id} 不存在`).toBeTruthy();
      expect(html).toContain(tool!.name);
    }
  });

  it('文案不出现营销腔禁用词', () => {
    for (const word of BANNED_WORDS) {
      expect(html, `404 页不应出现「${word}」`).not.toContain(word);
    }
  });
});
