import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * 可聚焦元素选择器。
 *
 * 覆盖原生可聚焦控件 + 显式 tabindex 的元素；
 * 排除 `disabled` 与 `tabindex="-1"`（后者只允许编程式聚焦，不参与 Tab 循环）。
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * 判断元素当前是否真的可以被聚焦（排除 `display:none` / `visibility:hidden` 的隐藏分支）。
 *
 * 用 `offsetParent` + 尺寸兜底判断，避免引入 `getComputedStyle` 的额外开销；
 * `position: fixed` 元素的 `offsetParent` 为 null，所以还要看盒模型尺寸。
 */
function isVisible(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  return (
    element.offsetParent !== null ||
    element.offsetWidth > 0 ||
    element.offsetHeight > 0 ||
    element.getClientRects().length > 0
  );
}

/** 取容器内当前可参与 Tab 循环的元素列表（按 DOM 顺序）。 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

export interface UseFocusTrapOptions {
  /** 是否启用焦点陷阱。通常直接传模态框的 open 状态。 */
  active: boolean;
  /** 按下 Esc 时的回调。不传则不接管 Esc（例如组件自己已有 Esc 逻辑）。 */
  onEscape?: () => void;
  /** 是否在激活时自动把焦点移入容器，默认 true。 */
  autoFocus?: boolean;
  /** 关闭时是否把焦点还给打开前的元素，默认 true。 */
  restoreFocus?: boolean;
}

/**
 * 模态框 / 抽屉通用的焦点陷阱。
 *
 * 职责：
 * 1. 激活时把焦点移入容器内第一个可聚焦元素（容器自身作为兜底，会临时挂 tabindex="-1"）
 * 2. Tab / Shift+Tab 在容器内循环，不会跑到背景页面上
 * 3. Esc 触发 `onEscape`
 * 4. 关闭时把焦点归位到打开前聚焦的元素
 *
 * 用法：
 * ```tsx
 * const dialogRef = useFocusTrap<HTMLDivElement>({ active: open, onEscape: onClose });
 * return open ? <div ref={dialogRef} role="dialog" aria-modal="true">…</div> : null;
 * ```
 *
 * 注意：`onEscape` 通过 ref 转发，调用方**无需** `useCallback` 包裹，
 * 传入内联箭头函数也不会导致焦点被反复重置。
 *
 * @returns 需要挂到模态框根节点上的 ref
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>({
  active,
  onEscape,
  autoFocus = true,
  restoreFocus = true,
}: UseFocusTrapOptions): RefObject<T> {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 用 ref 转发回调，保证 effect 的依赖只有 active，避免每次渲染重建监听 / 重置焦点
  const onEscapeRef = useRef<(() => void) | undefined>(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    if (typeof document === 'undefined') return;

    const container = containerRef.current;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // 1. 焦点移入容器
    if (autoFocus && container) {
      const first = getFocusableElements(container)[0];
      if (first) {
        first.focus();
      } else {
        // 容器内暂时没有可聚焦元素时，让容器本身接管焦点，避免焦点停留在背景
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
          container.dataset.focusTrapTabindex = 'true';
        }
        container.focus();
      }
    }

    // 2 & 3. Tab 循环 + Esc 关闭
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const escape = onEscapeRef.current;
        if (escape) {
          event.preventDefault();
          event.stopPropagation();
          escape();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const node = containerRef.current;
      if (!node) return;

      const focusable = getFocusableElements(node);
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const insideTrap = activeElement !== null && node.contains(activeElement);

      if (event.shiftKey) {
        if (!insideTrap || activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!insideTrap || activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);

      // 清理为兜底聚焦临时添加的 tabindex
      const node = containerRef.current;
      if (node && node.dataset.focusTrapTabindex === 'true') {
        node.removeAttribute('tabindex');
        delete node.dataset.focusTrapTabindex;
      }

      // 4. 焦点归位
      if (!restoreFocus) return;
      const previous = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [active, autoFocus, restoreFocus]);

  return containerRef;
}

export default useFocusTrap;
