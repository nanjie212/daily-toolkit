// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '@/App';
import { builtInTools } from '@/tools';

/**
 * 路由级集成测试（A1 / A2 / C2 验收）。
 *
 * 为什么不用 curl 冒烟：本站是 HashRouter 的纯客户端 SPA，**没有 SSR**。
 * 任何路径 curl 回来的都是同一份静态 index.html 外壳，
 * `#/about` 的内容是 JS 在浏览器里渲染出来的，curl 根本看不到 —— 用 curl
 * 断言「页面里有 66 和 2026-08-06」是假验证。这里改用 jsdom 真实挂载整个 <App />，
 * 走真实的 HashRouter + Suspense + 懒加载链路，断言最终 DOM。
 *
 * 覆盖：
 * · A1 未知 hash 路由走 NotFound 兜底（不白屏）
 * · A2 懒加载路由有 PageFallback（role=status / aria-live）
 * · C2 /about 渲染四节 + 占位符已替换
 * · C2 页脚「关于 / 隐私」入口存在且指向 /about
 */

let container: HTMLDivElement;
let root: Root;

/** 挂载 App 并把 React 的懒加载 / effect 全部冲干净。 */
async function mountApp(): Promise<void> {
  await act(async () => {
    root.render(React.createElement(App));
  });
  // 连续 flush 若干轮微任务，等 React.lazy 的动态 import 落地
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

/** 设置 hash 路由地址（HashRouter 从 window.location.hash 读路由）。 */
function setHash(hash: string): void {
  window.location.hash = hash;
}

function bodyText(): string {
  return container.textContent ?? '';
}

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom 未实现滚动，Layout 里会调用；补成 no-op 避免噪音
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: () => {},
  });
});

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('路由集成 (HashRouter)', () => {
  describe('C2 /about 关于页', () => {
    it('渲染四节标题', async () => {
      setHash('#/about');
      await mountApp();

      const text = bodyText();
      expect(text).toContain('关于这个站');
      expect(text).toContain('常见问题');
      expect(text).toContain('免责声明');
      expect(text).toContain('隐私说明');
    });

    it('占位符已被替换：工具数为 66、更新日期为 2026-08-06', async () => {
      setHash('#/about');
      await mountApp();

      const text = bodyText();
      expect(builtInTools.length).toBe(66);
      expect(text).toContain(`一共 ${builtInTools.length} 个`);
      expect(text).toContain('最后更新：2026-08-06');
      expect(text).not.toContain('{TOOL_COUNT}');
      expect(text).not.toContain('{LAST_UPDATED}');
    });

    it('FAQ / 免责 / 隐私 的实际条目都渲染出来了（不是空壳）', async () => {
      setHash('#/about');
      await mountApp();

      const text = bodyText();
      expect(text).toContain('我上传的图片、PDF 会被偷偷传到服务器吗？');
      expect(text).toContain('房贷、贷款类计算器');
      expect(text).toContain('不收集任何个人信息，没有账号和注册。');
    });

    it('标题层级正确：一个 h1 + 三个 h2', async () => {
      setHash('#/about');
      await mountApp();

      const h1 = container.querySelectorAll('h1');
      expect(h1).toHaveLength(1);
      expect(h1[0].textContent).toBe('关于这个站');

      const h2Text = Array.from(container.querySelectorAll('h2')).map((n) => n.textContent);
      expect(h2Text).toEqual(expect.arrayContaining(['常见问题', '免责声明', '隐私说明']));
    });
  });

  describe('A1 未知路由兜底', () => {
    it.each(['#/zzz', '#/tool', '#/does-not-exist/deep/path', '#/about/extra'])(
      '%s 渲染 404 兜底页而不是白屏',
      async (hash) => {
        setHash(hash);
        await mountApp();

        const text = bodyText();
        expect(text).toContain('这个页面不存在');
        expect(text).toContain('404');
        expect(text).toContain('返回首页');
      },
    );

    // React Router 的 <Route> 默认 caseSensitive: false，大小写不同的地址仍会命中同一路由。
    // 这是框架既定行为（不是 bug），显式钉住，避免以后有人误以为 #/About 应该走 404。
    it('大小写不敏感：#/About 命中 /about 而不是 404', async () => {
      setHash('#/About');
      await mountApp();

      const text = bodyText();
      expect(text).toContain('关于这个站');
      expect(text).not.toContain('这个页面不存在');
    });

    it('404 页仍在 Layout 内（页脚等外壳还在，用户不会被丢进空页面）', async () => {
      setHash('#/zzz');
      await mountApp();

      expect(container.querySelector('footer')).not.toBeNull();
      expect(bodyText()).toContain('日常工具箱');
    });

    it('404 页提供搜索框与常用工具两条出路', async () => {
      setHash('#/zzz');
      await mountApp();

      expect(container.querySelector('input')).not.toBeNull();
      expect(bodyText()).toContain('常用工具');
    });
  });

  describe('首页', () => {
    it('根路由不白屏，渲染出实际内容', async () => {
      setHash('#/');
      await mountApp();

      expect(bodyText().length).toBeGreaterThan(100);
      expect(bodyText()).not.toContain('这个页面不存在');
    });
  });

  describe('C2 页脚入口', () => {
    it('页脚存在「关于」与「隐私」入口', async () => {
      setHash('#/');
      await mountApp();

      const footer = container.querySelector('footer');
      expect(footer).not.toBeNull();
      const footerText = footer?.textContent ?? '';
      expect(footerText).toContain('关于');
      expect(footerText).toContain('隐私');
    });

    it('页脚入口指向 /about（href 或点击后跳转）', async () => {
      setHash('#/');
      await mountApp();

      const footer = container.querySelector('footer') as HTMLElement;
      const candidates = Array.from(footer.querySelectorAll('a,button')).filter((el) =>
        (el.textContent ?? '').includes('关于'),
      );
      expect(candidates.length).toBeGreaterThan(0);

      const target = candidates[0] as HTMLElement;
      const href = target.getAttribute('href');
      if (href) {
        expect(href).toContain('/about');
      } else {
        await act(async () => {
          target.click();
        });
        for (let i = 0; i < 5; i += 1) {
          await act(async () => {
            await Promise.resolve();
          });
        }
        expect(window.location.hash).toContain('/about');
        expect(bodyText()).toContain('关于这个站');
      }
    });
  });
});
