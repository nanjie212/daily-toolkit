import type { ToolRecord } from '@/types';

export const aiTools: ToolRecord[] = [
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
  {
    id: 'text-summary',
    name: '文本摘要',
    description: '自动提取文本的核心内容，生成简洁摘要',
    category: 'everyday',
    icon: 'FileTextIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文本', type: 'textarea', placeholder: '粘贴需要摘要的文本...', required: true },
      {
        key: 'length',
        label: '摘要长度',
        type: 'select',
        defaultValue: 'medium',
        options: [
          { label: '简短', value: 'short' },
          { label: '适中', value: 'medium' },
          { label: '详细', value: 'long' },
        ],
      },
    ],
    outputFormat: 'text',
    tips: '自动提取文本核心内容，支持简短/适中/详细三种摘要长度',
  },
  {
    id: 'text-to-speech',
    name: '文字转语音',
    description: '使用浏览器原生语音合成API将文字朗读出来',
    category: 'everyday',
    icon: 'Volume2Icon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'text', label: '输入文本', type: 'textarea', placeholder: '输入需要朗读的文字...', required: true },
      { key: 'rate', label: '语速', type: 'number', defaultValue: 1, placeholder: '0.1-10' },
    ],
    outputFormat: 'text',
    tips: '使用浏览器原生语音合成API，支持调节语速',
  },
];
