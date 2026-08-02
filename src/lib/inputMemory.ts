import { safeStorage } from '@/lib/safeStorage';

const PREFIX = 'toolbox_inputs_';

/** 读取某工具上次保存的输入值（仅返回该工具 schema 中存在的字段） */
export function loadInputs(toolId: string): Record<string, unknown> {
  return safeStorage.getJSON(PREFIX + toolId, {}) as Record<string, unknown>;
}

/** 持久化输入值，自动过滤不可序列化的 File / FileList / Blob */
export function saveInputs(toolId: string, values: Record<string, unknown>): void {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (
      typeof File !== 'undefined' && value instanceof File
      || typeof FileList !== 'undefined' && value instanceof FileList
      || typeof Blob !== 'undefined' && value instanceof Blob
    ) {
      continue;
    }
    clean[key] = value;
  }
  safeStorage.setJSON(PREFIX + toolId, clean);
}

/** 清空某工具的输入记忆 */
export function clearInputs(toolId: string): void {
  safeStorage.setJSON(PREFIX + toolId, {});
}
