import type { ToolRecord } from '@/types';

export const documentTools: ToolRecord[] = [
  {
    id: 'text-processor',
    name: '文本处理',
    description: '字数统计、繁简转换、大小写转换、文本去重，一站式文本处理',
    category: 'everyday',
    icon: 'TextIcon',
    version: '2.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      {
        key: 'mode',
        label: '选择功能',
        type: 'select',
        defaultValue: 'text-counter',
        options: [
          { label: '📊 字数统计', value: 'text-counter' },
          { label: '🔄 繁简转换', value: 'traditional-simplified' },
          { label: '🔠 大小写转换', value: 'case-converter' },
          { label: '🧹 文本去重', value: 'text-dedup' },
        ],
      },
      { key: 'text', label: '输入文本', type: 'textarea', placeholder: '粘贴需要处理的文本内容...', required: true },
      {
        key: 'convertMode',
        label: '转换方向/模式',
        type: 'select',
        defaultValue: 't2s',
        options: [
          { label: '繁体→简体', value: 't2s' },
          { label: '简体→繁体', value: 's2t' },
          { label: '全部大写', value: 'upper' },
          { label: '全部小写', value: 'lower' },
          { label: '首字母大写', value: 'capitalize' },
          { label: '驼峰式', value: 'camel' },
          { label: '蛇形式', value: 'snake' },
          { label: '中横线式', value: 'kebab' },
          { label: '精确去重', value: 'exact' },
          { label: '模糊去重(忽略空格)', value: 'fuzzy' },
          { label: '按行排序并去重', value: 'sort' },
        ],
      },
    ],
    outputFormat: 'text',
    tips: '字数统计：统计总字符、中文字符、单词数、行数等 | 繁简转换：使用OpenCC精准互转 | 大小写：6种格式 | 去重：3种模式',
  },
];