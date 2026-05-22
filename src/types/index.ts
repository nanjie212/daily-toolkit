export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  source: 'builtin' | 'community' | 'custom';
  permissions: string[];
  inputSchema: InputField[];
  outputFormat: string;
  tips?: string;
}

export interface InputField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'select' | 'number' | 'checkbox' | 'color';
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  accept?: string;
  multiple?: boolean;
  rows?: number;
}

export interface ToolOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  downloadUrl?: string;
  filename?: string;
  type?: string;
  提示?: string;
}

export interface ToolLifecycle {
  onInit?: () => Promise<void>;
  onExecute: (input: Record<string, unknown>) => Promise<ToolOutput>;
  onDestroy?: () => Promise<void>;
}

export interface ToolRecord extends ToolDefinition {
  code?: string;
  installedAt?: number;
  lastUsedAt?: number;
}

export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
  description: string;
  order: number;
}
