// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/**
 * A3 / A4 焦点陷阱行为测试（真实 DOM）。
 *
 * 这是本轮无障碍改造的核心 hook：OnboardingModal、HistoryDrawer、OutputModal、
 * ToolDetail、MobileNav、DonateSection 六处弹层全部依赖它，
 * 之前完全没有行为级覆盖（node 环境跑不了键盘事件）。
 * 这里通过 jsdom + React.act 驱动真实挂载/卸载，验证 hook 的四项职责：
 * 打开聚焦、Tab 循环、Esc 回调、关闭归位。
 *
 * ⚠️ jsdom 不做布局计算：offsetParent 恒为 null、offsetWidth/Height 恒为 0、
 * getClientRects() 恒为空，导致 hook 内的 isVisible() 会把所有元素判成不可见。
 * 因此下面用 patchOffsetParent() 按「display:none / hidden 才不可见」的规则
 * 补出 offsetParent 语义 —— 这是补齐 jsdom 的能力缺口，不是绕过被测逻辑。
 */

/** 元素自身是否被显式隐藏。 */
function isHiddenNode(el: HTMLElement): boolean {
  return el.style?.display === 'none' || el.hasAttribute('hidden');
}

/**
 * 给 jsdom 补上 offsetParent 语义：
 * 元素自身或任一祖先为 display:none / [hidden] 时返回 null，否则返回父元素。
 * 与浏览器的可见性判定对齐，让 hook 的 isVisible() 能正常工作。
 */
function patchOffsetParent(): void {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get(this: HTMLElement): Element | null {
      if (isHiddenNode(this)) return null;
      let ancestor = this.parentElement;
      while (ancestor) {
        if (isHiddenNode(ancestor)) return null;
        ancestor = ancestor.parentElement;
      }
      return this.parentElement;
    },
  });
}

function unpatchOffsetParent(): void {
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
}

interface HarnessProps {
  active: boolean;
  onEscape?: () => void;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  /** true 时容器只在 active 期间挂载（真实弹层的用法）；false 时容器常驻，只切换 active。 */
  unmountWhenInactive?: boolean;
  children?: React.ReactNode;
}

/** 模拟一个使用焦点陷阱的弹层。 */
function TrapHarness({
  active,
  onEscape,
  autoFocus,
  restoreFocus,
  unmountWhenInactive = true,
  children,
}: HarnessProps) {
  const ref = useFocusTrap<HTMLDivElement>({ active, onEscape, autoFocus, restoreFocus });
  if (unmountWhenInactive && !active) return null;
  return (
    <div ref={ref} id="dialog" role="dialog" aria-modal="true">
      {children}
    </div>
  );
}

/** 默认弹层内容：三个可聚焦按钮。 */
function defaultContent() {
  return (
    <>
      <button type="button" id="first">
        第一个
      </button>
      <button type="button" id="second">
        第二个
      </button>
      <button type="button" id="last">
        最后一个
      </button>
    </>
  );
}

let container: HTMLDivElement;
let root: Root;
/** 弹层外的触发按钮，用来验证「关闭后焦点归位」。 */
let trigger: HTMLButtonElement;

function render(ui: React.ReactElement): void {
  act(() => {
    root.render(ui);
  });
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`未找到 #${id}`);
  return el as T;
}

/** 在当前焦点元素上派发一次 keydown（hook 是在 document 捕获阶段监听的）。 */
function pressKey(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    (document.activeElement ?? document.body).dispatchEvent(event);
  });
  return event;
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  patchOffsetParent();

  trigger = document.createElement('button');
  trigger.id = 'trigger';
  trigger.textContent = '打开';
  document.body.appendChild(trigger);

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  trigger.remove();
  unpatchOffsetParent();
  vi.restoreAllMocks();
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = false;
});

describe('useFocusTrap', () => {
  describe('1. 打开时聚焦', () => {
    it('激活后焦点落到容器内第一个可聚焦元素', () => {
      render(<TrapHarness active>{defaultContent()}</TrapHarness>);

      expect(document.activeElement).toBe(byId('first'));
    });

    it('autoFocus=false 时不主动移动焦点', () => {
      trigger.focus();
      render(
        <TrapHarness active autoFocus={false}>
          {defaultContent()}
        </TrapHarness>,
      );

      expect(document.activeElement).toBe(trigger);
    });

    it('跳过 display:none 的元素，聚焦第一个真正可见的控件', () => {
      render(
        <TrapHarness active>
          <button type="button" id="hidden-btn" style={{ display: 'none' }}>
            隐藏
          </button>
          <button type="button" id="visible-btn">
            可见
          </button>
        </TrapHarness>,
      );

      expect(document.activeElement).toBe(byId('visible-btn'));
    });

    it('跳过 disabled 元素', () => {
      render(
        <TrapHarness active>
          <button type="button" id="disabled-btn" disabled>
            禁用
          </button>
          <button type="button" id="enabled-btn">
            可用
          </button>
        </TrapHarness>,
      );

      expect(document.activeElement).toBe(byId('enabled-btn'));
    });

    it('容器内没有可聚焦元素时，容器自身接管焦点并临时挂 tabindex="-1"', () => {
      render(
        <TrapHarness active>
          <p>纯文本，没有任何可聚焦控件</p>
        </TrapHarness>,
      );

      const dialog = byId('dialog');
      expect(document.activeElement).toBe(dialog);
      expect(dialog.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('2. Tab 循环', () => {
    it('焦点在最后一个元素时按 Tab 回到第一个', () => {
      render(<TrapHarness active>{defaultContent()}</TrapHarness>);
      act(() => byId('last').focus());

      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(byId('first'));
    });

    it('焦点在第一个元素时按 Shift+Tab 跳到最后一个', () => {
      render(<TrapHarness active>{defaultContent()}</TrapHarness>);
      act(() => byId('first').focus());

      const event = pressKey('Tab', { shiftKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(byId('last'));
    });

    it('焦点在中间元素时按 Tab 不拦截，交给浏览器默认行为', () => {
      render(<TrapHarness active>{defaultContent()}</TrapHarness>);
      act(() => byId('second').focus());

      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(false);
    });

    it('焦点跑到弹层外时，按 Tab 把它拉回容器内第一个元素', () => {
      render(<TrapHarness active>{defaultContent()}</TrapHarness>);
      act(() => trigger.focus());

      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(byId('first'));
    });

    it('display:none 的元素不参与 Tab 循环', () => {
      render(
        <TrapHarness active>
          <button type="button" id="a">
            A
          </button>
          <button type="button" id="b">
            B
          </button>
          <button type="button" id="c" style={{ display: 'none' }}>
            C（隐藏）
          </button>
        </TrapHarness>,
      );

      // 可见序列是 a → b，所以焦点在 b 上按 Tab 应回到 a（而不是走到隐藏的 c）
      act(() => byId('b').focus());
      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(byId('a'));
    });
  });

  describe('3. Esc 回调', () => {
    it('按 Esc 触发 onEscape 并阻止默认行为', () => {
      const onEscape = vi.fn();
      render(
        <TrapHarness active onEscape={onEscape}>
          {defaultContent()}
        </TrapHarness>,
      );

      const event = pressKey('Escape');

      expect(onEscape).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('不传 onEscape 时不接管 Esc（ShareButton 保留自有 ESC 逻辑的场景）', () => {
      render(<TrapHarness active>{defaultContent()}</TrapHarness>);

      const event = pressKey('Escape');

      expect(event.defaultPrevented).toBe(false);
    });

    it('onEscape 用内联箭头函数逐次更新，不需要 useCallback 也能拿到最新回调', () => {
      const firstCb = vi.fn();
      const secondCb = vi.fn();

      render(
        <TrapHarness active onEscape={firstCb}>
          {defaultContent()}
        </TrapHarness>,
      );
      // 重渲染换掉回调（模拟父组件每次渲染都传新的内联函数）
      render(
        <TrapHarness active onEscape={secondCb}>
          {defaultContent()}
        </TrapHarness>,
      );

      pressKey('Escape');

      expect(firstCb).not.toHaveBeenCalled();
      expect(secondCb).toHaveBeenCalledTimes(1);
    });

    it('active=false 时不监听键盘，Esc 不触发回调', () => {
      const onEscape = vi.fn();
      render(
        <TrapHarness active={false} onEscape={onEscape} unmountWhenInactive={false}>
          {defaultContent()}
        </TrapHarness>,
      );

      pressKey('Escape');

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('其它按键不会误触发 onEscape', () => {
      const onEscape = vi.fn();
      render(
        <TrapHarness active onEscape={onEscape}>
          {defaultContent()}
        </TrapHarness>,
      );

      pressKey('Enter');
      pressKey('a');
      pressKey('ArrowDown');

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('4. 关闭时焦点归位', () => {
    it('弹层卸载后焦点回到打开前聚焦的元素', () => {
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      render(
        <TrapHarness active>{defaultContent()}</TrapHarness>,
      );
      expect(document.activeElement).toBe(byId('first'));

      // 关闭弹层
      render(
        <TrapHarness active={false}>{defaultContent()}</TrapHarness>,
      );

      expect(document.activeElement).toBe(trigger);
    });

    it('restoreFocus=false 时不把焦点还回去', () => {
      trigger.focus();

      render(
        <TrapHarness active restoreFocus={false}>
          {defaultContent()}
        </TrapHarness>,
      );
      render(
        <TrapHarness active={false} restoreFocus={false}>
          {defaultContent()}
        </TrapHarness>,
      );

      expect(document.activeElement).not.toBe(trigger);
    });

    it('打开前的元素已从 DOM 移除时，归位逻辑不抛错', () => {
      const temp = document.createElement('button');
      temp.id = 'temp-trigger';
      document.body.appendChild(temp);
      temp.focus();

      render(<TrapHarness active>{defaultContent()}</TrapHarness>);
      temp.remove();

      expect(() =>
        render(<TrapHarness active={false}>{defaultContent()}</TrapHarness>),
      ).not.toThrow();
    });

    it('关闭后移除监听器，Esc 不再触发回调', () => {
      const onEscape = vi.fn();
      render(
        <TrapHarness active onEscape={onEscape}>
          {defaultContent()}
        </TrapHarness>,
      );
      render(
        <TrapHarness active={false} onEscape={onEscape}>
          {defaultContent()}
        </TrapHarness>,
      );

      pressKey('Escape');

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('关闭后清理为兜底聚焦临时添加的 tabindex', () => {
      render(
        <TrapHarness active unmountWhenInactive={false}>
          <p>没有可聚焦控件</p>
        </TrapHarness>,
      );
      const dialog = byId('dialog');
      expect(dialog.getAttribute('tabindex')).toBe('-1');

      render(
        <TrapHarness active={false} unmountWhenInactive={false}>
          <p>没有可聚焦控件</p>
        </TrapHarness>,
      );

      expect(byId('dialog').hasAttribute('tabindex')).toBe(false);
    });
  });
});
