import type { ToolRecord } from '@/types';

export const mediaTools: ToolRecord[] = [
  {
    id: 'video-to-gif',
    name: '视频转GIF',
    description: '将视频文件转换为GIF动图',
    icon: 'FilmIcon',
    category: 'media',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'file', label: '选择视频', type: 'file', accept: 'video/*', required: true },
      { key: 'width', label: 'GIF宽度(px)', type: 'number', defaultValue: 320, placeholder: '建议200-640' },
      { key: 'fps', label: '帧率(FPS)', type: 'select', options: [{ label: '5帧(小文件)', value: '5' }, { label: '10帧(推荐)', value: '10' }, { label: '15帧(流畅)', value: '15' }], defaultValue: '10' },
      { key: 'duration', label: '时长(秒)', type: 'number', defaultValue: 3, placeholder: '1-10秒' },
    ],
    outputFormat: 'blob',
  },
  {
    id: 'file-compress',
    name: '文件压缩解压',
    description: '压缩文件为ZIP或解压ZIP文件',
    icon: 'ArchiveIcon',
    category: 'media',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'mode', label: '操作模式', type: 'select', options: [{ label: '压缩为ZIP', value: 'compress' }, { label: '解压ZIP文件', value: 'decompress' }], defaultValue: 'compress' },
      { key: 'files', label: '选择文件(可多选)', type: 'file', accept: '*/*', required: true, multiple: true },
    ],
    outputFormat: 'blob',
  },
];
