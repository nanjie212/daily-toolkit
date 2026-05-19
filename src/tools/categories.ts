import type { CategoryRecord } from '@/types';

export const categories: CategoryRecord[] = [
  { id: 'everyday', name: '日常必备', icon: 'SparklesIcon', description: '计算器、房贷、个税、日期、汇率、密码等日常高频工具', order: 1 },
  { id: 'finance', name: '理财计算', icon: 'DollarSignIcon', description: '社保、存款、还贷、年终奖、购车税费等理财工具', order: 2 },
  { id: 'health', name: '健康生活', icon: 'HeartPulseIcon', description: 'BMI、卡路里、体脂率、基础代谢等健康管理工具', order: 3 },
  { id: 'image', name: '图片处理', icon: 'ImageIcon', description: '图片压缩、裁剪、证件照、水印、OCR、PDF等图片处理工具', order: 4 },
  { id: 'design', name: '设计配色', icon: 'PaintBucketIcon', description: '颜色提取、渐变生成、调色板、格式转换等设计工具', order: 5 },
  { id: 'coding', name: '编码转换', icon: 'CodeXmlIcon', description: 'Base64、URL编码、MD5、Unicode、摩斯密码等编码工具', order: 6 },
  { id: 'fun', name: '趣味娱乐', icon: 'SmileIcon', description: '随机美食、表情包、成语接龙、亲戚称呼等趣味工具', order: 7 },
];
