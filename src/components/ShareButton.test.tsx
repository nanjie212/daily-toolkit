import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ShareButton from './ShareButton';

/**
 * 关闭态渲染验证（无需 jsdom）：
 * react-dom/server 的 renderToStaticMarkup 只能渲染默认关闭态（不执行 effect / 不支持点击），
 * 足以证明「分享按钮全站常驻、不依赖是否打开面板」。打开态交互（二维码 / 复制降级 / Esc 关闭）
 * 依赖浏览器 API，由源码静态审查 + 构建产物字符串 grep 覆盖。
 */
describe('ShareButton 关闭态（常驻可见性）', () => {
  const html = renderToStaticMarkup(React.createElement(ShareButton));

  it('始终渲染常驻分享按钮 (aria-label="分享")', () => {
    expect(html).toContain('aria-label="分享"');
  });

  it('按钮使用 fixed top-4 right-4 固定定位（右上角常驻）', () => {
    expect(html).toContain('fixed top-4 right-4');
  });

  it('按钮层级 z-[300]，高于离线横幅 z-[200] 与底部导航 z-50', () => {
    expect(html).toContain('z-[300]');
  });

  it('满足移动端最小点击区 min-w-[44px] min-h-[44px]', () => {
    expect(html).toContain('min-w-[44px]');
    expect(html).toContain('min-h-[44px]');
  });

  it('桌面端显示文案、移动端仅图标 (hidden sm:inline)', () => {
    expect(html).toContain('hidden sm:inline');
  });

  it('按钮具备弹窗语义 (aria-haspopup="dialog" / aria-expanded)', () => {
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded');
  });

  it('默认关闭态不应渲染面板 (无 role="dialog")', () => {
    expect(html).not.toContain('role="dialog"');
  });
});
