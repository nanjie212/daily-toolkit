import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OnboardingModal, {
  ONBOARDING_STORAGE_KEY,
  isOnboardingDone,
  markOnboardingDone,
} from '@/components/OnboardingModal';
import { builtInTools } from '@/tools';

/** 与首屏同源的营销腔禁用词，引导文案同样不允许出现。 */
const BANNED_WORDS = ['赋能', '全能', '强大', '高效生产力', '一站式', '智能平台', '提升效率'];

/**
 * A3 新手引导改造验证（无需 jsdom）。
 *
 * 覆盖：dialog 语义、工具数量动态取数、「不再提示」默认勾选、营销词拦截、存储 key 唯一性。
 *
 * 说明：Esc 关闭与焦点陷阱（useFocusTrap 的 onEscape 分支）依赖键盘事件，
 * 在 node 环境下无法模拟，由源码静态审查 + useFocusTrap hook 的单元行为覆盖；
 * markOnboardingDone 的持久化写入依赖 localStorage，node 下被 safeStorage 静默降级，
 * 故仅验证「调用不抛错」与默认关闭态（isOnboardingDone 返回 false）。
 */
function renderModal(): string {
  return renderToStaticMarkup(
    React.createElement(OnboardingModal, { onClose: () => {} }),
  );
}

describe('OnboardingModal (A3 新手引导改造)', () => {
  const html = renderModal();

  it('默认带完整的 dialog 语义 (role/aria-modal/aria-labelledby/aria-describedby)', () => {
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('aria-describedby=');
  });

  it('「不再提示」复选框默认勾选', () => {
    expect(html).toContain('不再提示');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
  });

  it('工具数量从注册表动态读取，文案含「个实用工具」', () => {
    expect(html).toContain(`${builtInTools.length} 个实用工具`);
  });

  it('文案不出现营销腔禁用词', () => {
    for (const word of BANNED_WORDS) {
      expect(html, `引导文案不应出现「${word}」`).not.toContain(word);
    }
  });

  it('ONBOARDING_STORAGE_KEY 为全局唯一 key "onboarding-done"', () => {
    expect(ONBOARDING_STORAGE_KEY).toBe('onboarding-done');
  });

  it('默认未看过引导（无 localStorage 时回落为 false）', () => {
    expect(isOnboardingDone()).toBe(false);
  });

  it('markOnboardingDone 在无 localStorage 环境下静默降级、不抛错', () => {
    expect(() => markOnboardingDone()).not.toThrow();
  });
});
