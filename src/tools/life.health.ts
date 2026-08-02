import type { ToolRecord } from '@/types';

export const healthTools: ToolRecord[] = [
{
    id: 'bmi-calculator',
    name: 'BMI计算器',
    description: '计算身体质量指数，评估健康状态',
    category: 'health',
    icon: 'HeartIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [
      { key: 'weight', label: '体重', type: 'number', min: 0, placeholder: '体重(kg)', required: true },
      { key: 'height', label: '身高', type: 'number', min: 0, placeholder: '身高(cm)', required: true },
    ],
    outputFormat: 'text',
    tips: '输入体重和身高即可评估健康状态',
  },

{
    id: 'calorie-calc',
    name: '热量查询与计算',
    description: '查询食物热量和运动消耗，管理日常能量摄入',
    category: 'health',
    icon: 'UtensilsCrossedIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      {
        key: 'mode',
        label: '模式',
        type: 'select',
        defaultValue: 'food',
        options: [
          { label: '食物热量', value: 'food' },
          { label: '运动消耗', value: 'sport' },
        ],
      },
      { key: 'foodName', label: '食物名称', type: 'text', placeholder: '米饭/鸡蛋/苹果...', defaultValue: '' },
      { key: 'foodWeight', label: '食物重量(g)', type: 'number', placeholder: '食物重量(克)', defaultValue: 100 },
      { key: 'sportName', label: '运动名称', type: 'text', placeholder: '跑步/游泳/跳绳...', defaultValue: '' },
      { key: 'sportMin', label: '运动时长', type: 'number', placeholder: '运动时长(分钟)', defaultValue: 30 },
      { key: 'weight', label: '体重(运动模式)', type: 'number', min: 0, placeholder: '体重(kg)', defaultValue: 65 },
    ],
    outputFormat: 'text',
    tips: '内置常见食物和运动热量数据库',
  },

{
    id: 'due-date-calc',
    name: '预产期计算器',
    description: '根据末次月经估算预产期和当前孕周',
    category: 'health',
    icon: 'BabyIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'lmp', label: '末次月经日期', type: 'text', placeholder: 'YYYY-MM-DD', required: true },
    ],
    outputFormat: 'text',
    tips: 'Naegele公式估算，实际可能偏离±2周',
  },

{
    id: 'body-fat-calc',
    name: '体脂率计算器',
    description: '测量体脂率，评估体脂等级和健康状态',
    category: 'health',
    icon: 'ActivityIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'weight', label: '体重', type: 'number', min: 0, placeholder: '体重(kg)', required: true },
      { key: 'waist', label: '腰围', type: 'number', placeholder: '腰围(cm)', required: true },
      { key: 'neck', label: '颈围', type: 'number', placeholder: '颈围(cm)', defaultValue: 38 },
      { key: 'height', label: '身高', type: 'number', min: 0, placeholder: '身高(cm)', defaultValue: 170 },
      {
        key: 'gender',
        label: '性别',
        type: 'select',
        defaultValue: 'male',
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
        ],
      },
      { key: 'hip', label: '臀围(女性)', type: 'number', placeholder: '臀围(cm)', defaultValue: 95 },
    ],
    outputFormat: 'text',
    tips: '美国海军方法估算，误差约±3%',
  },

{
    id: 'bmr-calc',
    name: '基础代谢计算器',
    description: '计算BMR和TDEE，制定减脂增肌摄入计划',
    category: 'health',
    icon: 'FlameIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'weight', label: '体重', type: 'number', min: 0, placeholder: '体重(kg)', required: true, defaultValue: 65 },
      { key: 'height', label: '身高', type: 'number', min: 0, placeholder: '身高(cm)', required: true, defaultValue: 170 },
      { key: 'age', label: '年龄', type: 'number', min: 0, placeholder: '年龄', required: true, defaultValue: 25 },
      {
        key: 'gender',
        label: '性别',
        type: 'select',
        defaultValue: 'male',
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
        ],
      },
      {
        key: 'activity',
        label: '活动水平',
        type: 'select',
        defaultValue: '1.55',
        options: [
          { label: '久坐不动 (1.2)', value: '1.2' },
          { label: '轻度活动 (1.375)', value: '1.375' },
          { label: '中度活动 (1.55)', value: '1.55' },
          { label: '活跃 (1.725)', value: '1.725' },
          { label: '重度活动 (1.9)', value: '1.9' },
        ],
      },
    ],
    outputFormat: 'text',
    tips: 'Mifflin-St Jeor公式，含减脂15%增肌15%建议',
  },

{
    id: 'heart-rate-zone-calc',
    name: '心率区间计算器',
    description: '根据年龄和安静心率计算运动心率区间',
    category: 'health',
    icon: 'HeartPulseIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'age', label: '年龄', type: 'number', min: 0, placeholder: '年龄', required: true, defaultValue: 30 },
      { key: 'restHR', label: '安静心率', type: 'number', min: 0, placeholder: '安静心率(次/分)', defaultValue: 70 },
    ],
    outputFormat: 'text',
    tips: 'Karvonen储备心率法计算五大运动区间',
  }
];
