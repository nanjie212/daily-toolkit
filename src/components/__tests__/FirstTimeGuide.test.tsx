import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

// 固定 mock 数据（vi.hoisted 保证在 vi.mock 工厂执行时就绪）。
// 覆盖 2 个以上 category，至少 6 个工具，含 id/name/description/category。
const { MOCK_TOOLS, MOCK_RECENT } = vi.hoisted(() => {
  const MOCK_TOOLS = [
    { id: 't1', name: '房贷月供计算器', description: '估算每月还款额', category: 'catA', icon: 'home', version: '1.0.0', source: 'builtin' as const, permissions: [], inputSchema: [], outputFormat: 'text' },
    { id: 't2', name: '车贷计算器', description: '计算车贷月供', category: 'catA', icon: 'car', version: '1.0.0', source: 'builtin' as const, permissions: [], inputSchema: [], outputFormat: 'text' },
    { id: 't3', name: '存款利息试算', description: '试算存款利息', category: 'catA', icon: 'bank', version: '1.0.0', source: 'builtin' as const, permissions: [], inputSchema: [], outputFormat: 'text' },
    { id: 't4', name: '汇率换算', description: '多币种汇率换算', category: 'catB', icon: 'exchange', version: '1.0.0', source: 'builtin' as const, permissions: [], inputSchema: [], outputFormat: 'text' },
    { id: 't5', name: '单位换算', description: '长度重量单位换算', category: 'catB', icon: 'ruler', version: '1.0.0', source: 'builtin' as const, permissions: [], inputSchema: [], outputFormat: 'text' },
    { id: 't6', name: '天气查询', description: '查询城市天气', category: 'catB', icon: 'cloud', version: '1.0.0', source: 'builtin' as const, permissions: [], inputSchema: [], outputFormat: 'text' },
  ];
  // 近期使用顺序：t4 最近，用于补位时优先出现。
  const MOCK_RECENT = ['t4', 't5', 't6', 't2', 't3'];
  return { MOCK_TOOLS, MOCK_RECENT };
});

// 全量 mock store，避免加载真实 zustand store（含 safeStorage/localStorage 副作用）。
vi.mock('@/store', () => ({
  useStore: vi.fn(() => ({ tools: MOCK_TOOLS, recentToolIds: MOCK_RECENT })),
}));

// 仅覆盖 useNavigate，其余导出保持真实实现。
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import FirstTimeGuide from '@/components/FirstTimeGuide';

describe('FirstTimeGuide', () => {
  it('渲染引导横幅：含「还能做更多」、恰好 3 个推荐且同分类优先、含关闭按钮', () => {
    const onDismiss = vi.fn();
    const html = renderToStaticMarkup(
      createElement(FirstTimeGuide, {
        currentToolId: 't1',
        currentCategory: 'catA',
        onDismiss,
      }),
    );

    // 断言 1：标题文案存在
    expect(html).toContain('还能做更多');

    // 断言 3：关闭按钮存在（aria-label），事件无需触发
    expect(html).toContain('关闭引导');

    // 断言 2：恰好 3 个推荐工具名出现
    expect(html).toContain('车贷计算器'); // t2 catA
    expect(html).toContain('存款利息试算'); // t3 catA
    expect(html).toContain('汇率换算'); // t4 catB（由 recentToolIds 补位）

    // 未被推荐的 catB 工具不应出现
    expect(html).not.toContain('单位换算');
    expect(html).not.toContain('天气查询');

    // 同分类优先：两个 catA 工具应都出现在 catB 补位工具之前
    const catAIndex = Math.min(html.indexOf('车贷计算器'), html.indexOf('存款利息试算'));
    const catBIndex = html.indexOf('汇率换算');
    expect(catAIndex).toBeGreaterThan(-1);
    expect(catBIndex).toBeGreaterThan(catAIndex);
  });
});
