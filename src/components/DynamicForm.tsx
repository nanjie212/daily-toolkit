import { useState, type ChangeEvent } from 'react';
import type { InputField } from '@/types';

interface DynamicFormProps {
  schema: InputField[];
  onSubmit: (values: Record<string, unknown>) => void;
  loading?: boolean;
}

export default function DynamicForm({ schema, onSubmit, loading }: DynamicFormProps) {
  const initialValues: Record<string, unknown> = {};
  schema.forEach((field) => {
    initialValues[field.key] = field.defaultValue ?? '';
  });

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    if (fileList.length === 1) {
      handleChange(key, fileList[0]);
      setFileNames((prev) => ({ ...prev, [key]: fileList[0].name }));
    } else {
      const files = Array.from(fileList);
      handleChange(key, files);
      setFileNames((prev) => ({ ...prev, [key]: `${files.length} 个文件` }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>

          {field.type === 'text' && (
            <input
              type="text"
              value={(values[field.key] as string) || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              value={(values[field.key] as string) || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={6}
              className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all resize-y"
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              value={values[field.key] as number | string}
              onChange={(e) => handleChange(field.key, e.target.value ? Number(e.target.value) : '')}
              placeholder={field.placeholder}
              className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
            />
          )}

          {field.type === 'select' && (
            <select
              value={(values[field.key] as string) || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all appearance-none"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface">
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {field.type === 'checkbox' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${
                  values[field.key] ? 'bg-accent' : 'bg-white/10'
                }`}
                onClick={() => handleChange(field.key, !values[field.key])}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    values[field.key] ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-400">
                {values[field.key] ? '已启用' : '已禁用'}
              </span>
            </label>
          )}

          {field.type === 'file' && (
            <div className="relative">
              <input
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                onChange={(e) => handleFileChange(field.key, e)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full px-4 py-2.5 bg-surface border border-dashed border-white/20 rounded-xl text-gray-400 flex items-center justify-center gap-2 hover:border-accent/50 transition-colors">
                <span>{fileNames[field.key] || field.placeholder || '点击选择文件'}</span>
              </div>
            </div>
          )}

          {field.type === 'color' && (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={(values[field.key] as string) || '#000000'}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <span className="text-sm text-gray-400">
                {(values[field.key] as string) || '#000000'}
              </span>
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            执行中...
          </>
        ) : (
          '执行'
        )}
      </button>
    </form>
  );
}
