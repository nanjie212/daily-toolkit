class SafeStorage {
  private storage: Storage | null = null;

  constructor() {
    try {
      const testKey = '__toolbox_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      this.storage = localStorage;
    } catch {
      this.storage = null;
    }
  }

  getItem(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage?.setItem(key, value);
    } catch (e) {
      // 隐私模式/配额满时静默降级，仅留日志便于排查
      console.warn('[safeStorage] setItem 失败:', key, e);
    }
  }

  removeItem(key: string): void {
    try {
      this.storage?.removeItem(key);
    } catch (e) {
      console.warn('[safeStorage] removeItem 失败:', key, e);
    }
  }

  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = this.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  setJSON(key: string, value: unknown): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[safeStorage] setJSON 失败:', key, e);
    }
  }
}

export const safeStorage = new SafeStorage();
