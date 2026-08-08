import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * A3 新手引导「持久化」行为测试。
 *
 * 现有的 OnboardingModal.test.tsx 只能验证「无 localStorage 时静默降级」，
 * 因为 safeStorage 是模块级单例、在 node 环境下构造时就把 storage 置成了 null，
 * 于是 isOnboardingDone() 永远返回 false —— 真正的业务诉求
 * 「关掉引导后刷新页面不再弹」从来没被覆盖过。
 *
 * 这里通过「先注入 localStorage 桩 → 再 vi.resetModules() 动态 import」
 * 的方式，让 safeStorage 单例在有存储的环境下重新构造，从而真实地验证读写链路。
 * 二次 resetModules + 再 import 等价于「刷新页面」：模块状态清空，但存储还在。
 */

/** 最小可用的 Storage 实现，行为对齐浏览器（含 length / key / clear）。 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  } as Storage;
}

/** 模拟隐私模式 / 配额耗尽：任何写入都抛错。 */
function createThrowingStorage(): Storage {
  return {
    get length() {
      return 0;
    },
    key() {
      return null;
    },
    getItem() {
      throw new DOMException('SecurityError');
    },
    setItem() {
      throw new DOMException('QuotaExceededError');
    },
    removeItem() {
      throw new DOMException('SecurityError');
    },
    clear() {
      throw new DOMException('SecurityError');
    },
  } as unknown as Storage;
}

type OnboardingModule = typeof import('@/components/OnboardingModal');

/** 装上指定 storage 后重新加载模块图，等价于「带着这份存储刷新一次页面」。 */
async function loadWithStorage(storage: Storage): Promise<OnboardingModule> {
  vi.stubGlobal('localStorage', storage);
  vi.resetModules();
  return import('@/components/OnboardingModal');
}

const STORAGE_KEY = 'onboarding-done';

describe('新手引导持久化 (A3)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('首次访问：存储为空时 isOnboardingDone() 为 false（引导应弹出）', async () => {
    const storage = createMemoryStorage();
    const { isOnboardingDone } = await loadWithStorage(storage);

    expect(isOnboardingDone()).toBe(false);
  });

  it('markOnboardingDone() 把标记真正写进 localStorage', async () => {
    const storage = createMemoryStorage();
    const { markOnboardingDone, ONBOARDING_STORAGE_KEY } = await loadWithStorage(storage);

    markOnboardingDone();

    expect(ONBOARDING_STORAGE_KEY).toBe(STORAGE_KEY);
    expect(storage.getItem(STORAGE_KEY)).toBe('1');
  });

  it('写入后同一会话内 isOnboardingDone() 立刻变为 true', async () => {
    const storage = createMemoryStorage();
    const { isOnboardingDone, markOnboardingDone } = await loadWithStorage(storage);

    expect(isOnboardingDone()).toBe(false);
    markOnboardingDone();
    expect(isOnboardingDone()).toBe(true);
  });

  it('核心诉求：关掉引导后「刷新页面」不再判定为首次访问', async () => {
    const storage = createMemoryStorage();

    // 第一次访问：看到引导 → 勾选「不再提示」关闭
    const first = await loadWithStorage(storage);
    expect(first.isOnboardingDone()).toBe(false);
    first.markOnboardingDone();

    // 刷新：模块状态全部重建，但 storage 沿用同一份
    const second = await loadWithStorage(storage);
    expect(second.isOnboardingDone()).toBe(true);
  });

  it('未调用 markOnboardingDone（取消勾选「不再提示」）时，刷新后仍会再弹', async () => {
    const storage = createMemoryStorage();

    const first = await loadWithStorage(storage);
    expect(first.isOnboardingDone()).toBe(false);
    // 不落盘，直接关闭

    const second = await loadWithStorage(storage);
    expect(second.isOnboardingDone()).toBe(false);
  });

  it('只写这一个 key，不污染其它存储项', async () => {
    const storage = createMemoryStorage();
    storage.setItem('toolbox_visit_count', '3');

    const { markOnboardingDone } = await loadWithStorage(storage);
    markOnboardingDone();

    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).sort();
    expect(keys).toEqual([STORAGE_KEY, 'toolbox_visit_count'].sort());
    expect(storage.getItem('toolbox_visit_count')).toBe('3');
  });

  it('隐私模式 / 配额耗尽：读写都不抛错，降级为「未看过」', async () => {
    const { isOnboardingDone, markOnboardingDone } = await loadWithStorage(createThrowingStorage());

    expect(() => markOnboardingDone()).not.toThrow();
    expect(() => isOnboardingDone()).not.toThrow();
    expect(isOnboardingDone()).toBe(false);
  });
});
