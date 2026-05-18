import type { ToolRecord } from '@/types';
import { builtInTools } from '@/tools';

const CUSTOM_TOOLS_KEY = 'toolbox_custom_tools';

function loadCustomTools(): ToolRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadAllTools(): ToolRecord[] {
  const custom = loadCustomTools();
  return [...builtInTools, ...custom];
}

export function loadBuiltInTools(): ToolRecord[] {
  return [...builtInTools];
}

export function saveCustomTool(tool: ToolRecord): void {
  const custom = loadCustomTools();
  const idx = custom.findIndex((t) => t.id === tool.id);
  if (idx >= 0) {
    custom[idx] = tool;
  } else {
    custom.push({ ...tool, installedAt: Date.now() });
  }
  localStorage.setItem(CUSTOM_TOOLS_KEY, JSON.stringify(custom));
}

export function removeCustomTool(id: string): void {
  const custom = loadCustomTools().filter((t) => t.id !== id);
  localStorage.setItem(CUSTOM_TOOLS_KEY, JSON.stringify(custom));
}
