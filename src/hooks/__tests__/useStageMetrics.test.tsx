// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import React, { act, useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useStageMetrics, type StageMetrics } from '@/hooks/useStageMetrics';

/**
 * useStageMetrics 的 prefers-reduced-motion 探测回归测试（QA M5 变异缺口）。
 *
 * 守卫点：hook 用 `window.matchMedia('(prefers-reduced-motion: reduce)')` 探测，
 * matches=true 时输出 reducedMotion=true；matches=false 时为 false；
 * 且注册的 change 监听能跟随系统设置实时翻转。
 *
 * ⚠️ hook 的 effect 第一行要求 `typeof ResizeObserver !== 'undefined'`，
 * jsdom 默认没有 ResizeObserver，所以这里先 stub 一个空实现，
 * 否则 effect 会提前 return、matchMedia 根本不会被读取（那会测出假绿）。
 *
 * 环境：jsdom + createRoot/act，沿用 useFocusTrap.test.tsx 的写法。
 */

/** 可编程的 fake MediaQueryList：既能返回初始 matches，也能手动触发 change 事件。 */
function createFakeMql(initialMatches: boolean) {
  const changeListeners: Array<(e: { matches: boolean }) => void> = [];
  let matches = initialMatches;
  return {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: string, cb: (e: { matches: boolean }) => void) => {
      changeListeners.push(cb);
    },
    removeEventListener: (_type: string, cb: (e: { matches: boolean }) => void) => {
      const i = changeListeners.indexOf(cb);
      if (i >= 0) changeListeners.splice(i, 1);
    },
    /** 测试辅助：模拟系统设置变化，触发已注册的 change 回调 */
    emit(next: boolean) {
      matches = next;
      const e = { matches: next };
      changeListeners.forEach((cb) => cb(e));
    },
  };
}

/** 空 ResizeObserver：hook 只依赖它不崩溃，尺寸断言不是本测试目标 */
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

interface StageHarnessProps {
  onResult: (m: StageMetrics) => void;
}

function StageHarness({ onResult }: StageHarnessProps) {
  const ref = useRef<HTMLDivElement>(null);
  const metrics = useStageMetrics(ref);
  useEffect(() => {
    onResult(metrics);
  });
  return <div ref={ref} style={{ width: 800, height: 600 }} />;
}

let container: HTMLDivElement;
let root: Root;
/** 每次 render 的 useEffect 都会刷新它，供「系统设置变化」用例读取最新值 */
let latestMetrics: StageMetrics | undefined;

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = false;
});

function mount(): StageMetrics {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<StageHarness onResult={(m) => { latestMetrics = m; }} />);
  });
  if (!latestMetrics) throw new Error('hook 未输出结果');
  return latestMetrics;
}

function unmount(): void {
  act(() => root.unmount());
  container.remove();
  latestMetrics = undefined;
}

afterEach(() => {
  if (root) unmount();
  vi.unstubAllGlobals();
});

describe('useStageMetrics · prefers-reduced-motion 探测（M5 守卫）', () => {
  it('matchMedia 返回 matches=true 时 reducedMotion=true', () => {
    const mql = createFakeMql(true);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    const metrics = mount();
    expect(metrics.reducedMotion).toBe(true);
    expect(metrics.ready).toBe(true);
  });

  it('matchMedia 返回 matches=false 时 reducedMotion=false', () => {
    const mql = createFakeMql(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    const metrics = mount();
    expect(metrics.reducedMotion).toBe(false);
  });

  it('系统设置变化时 change 监听实时翻转 reducedMotion', () => {
    const mql = createFakeMql(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    mount();
    expect(latestMetrics?.reducedMotion).toBe(false);

    act(() => {
      mql.emit(true);
    });
    expect(latestMetrics?.reducedMotion).toBe(true);

    act(() => {
      mql.emit(false);
    });
    expect(latestMetrics?.reducedMotion).toBe(false);
  });
});
