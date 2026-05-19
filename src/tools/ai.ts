import type { ToolRecord } from '@/types';

export const aiTools: ToolRecord[] = [
  {
    id: 'text-translate',
    name: '文本翻译',
    description: '使用 MyMemory 翻译引擎进行多语言文本翻译',
    category: 'everyday',
    icon: 'LanguagesIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'text', label: '文本内容', type: 'textarea', placeholder: '输入需要翻译的文本...', required: true },
      {
        key: 'sourceLang',
        label: '源语言',
        type: 'select',
        defaultValue: 'zh',
        options: [
          { label: '中文', value: 'zh' },
          { label: '英语', value: 'en' },
          { label: '日语', value: 'ja' },
          { label: '韩语', value: 'ko' },
        ],
      },
      {
        key: 'targetLang',
        label: '目标语言',
        type: 'select',
        defaultValue: 'en',
        options: [
          { label: '中文', value: 'zh' },
          { label: '英语', value: 'en' },
          { label: '日语', value: 'ja' },
          { label: '韩语', value: 'ko' },
        ],
      },
    ],
    outputFormat: 'text',
    tips: '支持中英日韩等语言互译，每天免费5000字',
  },
  {
    id: 'e-signature',
    name: '电子签名',
    description: '在画板上手写签名，生成透明背景签名图片',
    icon: 'PenLineIcon',
    category: 'everyday',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'signerName', label: '签名者姓名', type: 'text', placeholder: '输入姓名...', required: true },
      { key: 'color', label: '笔迹颜色', type: 'color', defaultValue: '#000000' },
      { key: 'fontStyle', label: '字体风格', type: 'select', options: [{ label: '手写体', value: 'cursive' }, { label: '楷体', value: 'serif' }, { label: '艺术体', value: 'fantasy' }], defaultValue: 'cursive' },
    ],
    outputFormat: 'blob',
    tips: '手写或选择字体风格生成透明背景签名图片',
  },
];
