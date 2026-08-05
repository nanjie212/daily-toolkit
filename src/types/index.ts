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
  type: 'text' | 'textarea' | 'file' | 'select' | 'number' | 'checkbox' | 'color' | 'date';
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  accept?: string;
  multiple?: boolean;
  rows?: number;
  /**
   * 数值下限（type: 'number'）或文本最小长度（type: 'text' / 'textarea'）。
   * 由 validateField / validateInput 统一消费，工具无需自行判断。
   */
  min?: number;
  /**
   * 数值上限（type: 'number'）或文本最大长度（type: 'text' / 'textarea'）。
   */
  max?: number;
  /** 数值输入的步进值（type: 'number'），如 0.1。 */
  step?: number;
  /** 条件显隐：仅当 field 字段的值等于 equals 时才渲染该输入项。 */
  showIf?: { field: string; equals: unknown };
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
