export interface ValidationOutcome {
  ok: boolean;
  errors: Record<string, string>;
  values: Record<string, unknown>;
}

interface FieldSpec {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

// 统一输入校验层：基于工具的 inputSchema 在分发执行前做一次校验。
// 覆盖最常见崩溃来源：必填缺失、非数字、负数 / 越界（如工资、本金、价格等带 min:0 的字段）。
export function validateInput(
  schema: FieldSpec[] | undefined,
  raw: Record<string, unknown>,
): ValidationOutcome {
  const errors: Record<string, string> = {};
  const values: Record<string, unknown> = { ...raw };
  const fields = schema ?? [];

  for (const f of fields) {
    const label = f.label ?? f.key;
    const v = raw[f.key];

    const isEmpty =
      v === undefined ||
      v === null ||
      (typeof v === 'string' && (v as string).trim() === '');

    if (f.required && isEmpty) {
      errors[f.key] = label + '不能为空';
      continue;
    }
    if (isEmpty) continue;

    if (f.type === 'number') {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isNaN(n)) {
        errors[f.key] = label + '必须是数字';
        continue;
      }
      if (typeof f.min === 'number' && n < f.min) {
        errors[f.key] = label + '不能小于 ' + String(f.min);
        continue;
      }
      if (typeof f.max === 'number' && n > f.max) {
        errors[f.key] = label + '不能大于 ' + String(f.max);
        continue;
      }
      values[f.key] = n;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors, values };
}
