import type { CategoryRecord } from '@/types';

export const categories: CategoryRecord[] = [
  { id: 'everyday', name: '日常必备', icon: 'SparklesIcon', description: '计算器、房贷、个税、日期、倒计时、秒表、二维码等日常高频工具', order: 1 },
  { id: 'image', name: '图片工具', icon: 'ImageIcon', description: '图片压缩、格式转换、证件照、水印、拼接、OCR、转PDF等图片处理工具', order: 2 },
  { id: 'text', name: '文字处理', icon: 'FileTextIcon', description: '文本统计、摘要、翻译、语音转文字、文字转语音、电子签名等工具', order: 3 },
  { id: 'media', name: '影音工具', icon: 'FilmIcon', description: '视频转GIF、文件压缩解压等影音处理工具', order: 4 },
];
