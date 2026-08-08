import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ShareButton from './ShareButton';
import LeadBar from './grid/LeadBar';

/**
 * ShareButton 关闭态渲染验证（无需 jsdom）。
 *
 * ShareButton 现在是 LeadBar 的子组件，不再独立 fixed 定位。
 * 定位/层级由 LeadBar 统一管理（z-[350] fixed top-4 right-4）。
 */
describe('ShareButton 关闭态（常驻可见性）', () => {
  const sbHtml = renderToStaticMarkup(React.createElement(ShareButton));
  const lbHtml = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(LeadBar)),
  );

  it('始终渲染常驻分享按钮 (aria-label="分享")', () => {
    expect(sbHtml).toContain('aria-label="分享"');
  });

  it('LeadBar 容器使用 fixed top-4 right-4 固定定位（右上角常驻）', () => {
    expect(lbHtml).toContain('fixed top-4 right-4');
  });

  it('LeadBar 容器层级 z-[350]，高于离线横幅 z-[200] 与底部导航 z-50', () => {
    expect(lbHtml).toContain('z-[350]');
  });

  it('LeadBar 包含 ShareButton 组件', () => {
    expect(lbHtml).toContain('aria-label="分享"');
  });

  it('满足移动端最小点击区 min-w-[48px] min-h-[48px]', () => {
    expect(sbHtml).toContain('min-w-[48px]');
    expect(sbHtml).toContain('min-h-[48px]');
  });

  it('桌面端显示文案、移动端仅图标 (hidden sm:inline)', () => {
    expect(sbHtml).toContain('hidden sm:inline');
  });

  it('按钮具备弹窗语义 (aria-haspopup="dialog" / aria-expanded)', () => {
    expect(sbHtml).toContain('aria-haspopup="dialog"');
    expect(sbHtml).toContain('aria-expanded');
  });

  it('默认关闭态不应渲染面板 (无 role="dialog")', () => {
    expect(sbHtml).not.toContain('role="dialog"');
  });
});
