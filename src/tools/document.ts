import type { ToolRecord } from '@/types';

export const documentTools: ToolRecord[] = [
  {
    id: 'text-counter',
    name: '文本统计',
    description: '统计文本的字符数、词数、行数等信息',
    category: 'text',
    icon: 'HashIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'text', label: '文本内容', type: 'textarea', placeholder: '在此输入需要统计的文本...', required: true },
    ],
    outputFormat: 'json',
  },
  {
    id: 'traditional-simplified',
    name: '繁简转换',
    description: '在繁体中文和简体中文之间转换',
    category: 'everyday',
    icon: 'LanguagesIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'text', label: '文本内容', type: 'textarea', placeholder: '输入需要转换的中文文本...', required: true },
      {
        key: 'mode',
        label: '转换模式',
        type: 'select',
        defaultValue: 't2s',
        options: [
          { label: '繁体→简体', value: 't2s' },
          { label: '简体→繁体', value: 's2t' },
        ],
      },
    ],
    outputFormat: 'text',
  },
  {
    id: 'case-converter',
    name: '大小写转换',
    description: '英文大小写转换，支持多种模式',
    category: 'everyday',
    icon: 'CaseSensitiveIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'text', label: '文本内容', type: 'textarea', placeholder: '输入英文文本...', required: true },
      {
        key: 'mode',
        label: '转换模式',
        type: 'select',
        defaultValue: 'upper',
        options: [
          { label: '全部大写', value: 'upper' },
          { label: '全部小写', value: 'lower' },
          { label: '首字母大写', value: 'capitalize' },
          { label: '句首大写', value: 'sentence' },
          { label: '交替大小写', value: 'alternating' },
        ],
      },
    ],
    outputFormat: 'text',
  },
  {
    id: 'text-dedup',
    name: '文字去重',
    description: '去除文本中的重复行',
    category: 'everyday',
    icon: 'ListFilterIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'text', label: '文本内容', type: 'textarea', placeholder: '每行一条内容...', required: true },
      {
        key: 'mode',
        label: '去重模式',
        type: 'select',
        defaultValue: 'exact',
        options: [
          { label: '去除完全重复行', value: 'exact' },
          { label: '去除空白行', value: 'blank' },
          { label: '去除重复行并排序', value: 'sort' },
        ],
      },
    ],
    outputFormat: 'text',
  },
];
