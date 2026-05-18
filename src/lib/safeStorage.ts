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
    } catch {
    }
  }

  removeItem(key: string): void {
    try {
      this.storage?.removeItem(key);
    } catch {
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
    } catch {
    }
  }
}

export const safeStorage = new SafeStorage();
