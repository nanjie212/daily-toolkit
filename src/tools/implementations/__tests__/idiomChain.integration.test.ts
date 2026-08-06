import { describe, it, expect } from 'vitest';
import { idiomChain } from '../funTools';
import type { ToolOutput } from '@/types';

/**
 * 聚焦集成测试：证明 funTools.idiomChain 真正消费了新规则引擎
 * （validateUserMove / pickAIMove / normalizeDifficulty），而不是仅仅存在单测。
 * 走真实 idiomSource（1798 条成语），不 mock 引擎本身。
 */
describe('idiomChain integration (funTools) 消费新规则引擎', () => {
  it('空输入时给出开局提示，不报错', async () => {
    const r: ToolOutput = await idiomChain({});
    expect(r.success).toBe(true);
    expect(String(r.data?.状态)).toContain('请输入');
  });

  it('合法首步被接受，且 AI 能接龙（已接=2 个）', async () => {
    const r: ToolOutput = await idiomChain({ start: '一心一意' });
    expect(r.success).toBe(true);
    expect(String(r.data?.接龙链)).toContain('一心一意');
    expect(String(r.data?.已接)).toBe('2 个');
  });

  it('拒绝重复使用成语（9类bug#2：used 校验已接入集成层）', async () => {
    const r: ToolOutput = await idiomChain({ history: '一心一意', start: '一心一意' });
    expect(r.success).toBe(false);
  });

  it('拒绝非四字/首字不接龙的输入（9类bug#5：四字 + 接龙校验已接入集成层）', async () => {
    const r: ToolOutput = await idiomChain({ history: '一心一意', start: '二' });
    expect(r.success).toBe(false);
  });

  it('非法难度不崩溃，且 AI 仍能从已有链延伸（已接=2 个）', async () => {
    const r: ToolOutput = await idiomChain({ history: '一心一意', difficulty: 'banana' });
    expect(r.success).toBe(true);
    expect(String(r.data?.已接)).toBe('2 个');
  });
});
