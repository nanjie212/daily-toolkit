import type { ToolRecord } from '@/types';
import { imageTools } from './image';
import { documentTools } from './document';
import { aiTools } from './ai';
import { lifeTools } from './life';
import { mediaTools } from './media';
import { funTools } from './fun';
import { pdfTools } from './pdf';

export const builtInTools: ToolRecord[] = [
  ...imageTools,
  ...pdfTools,
  ...documentTools,
  ...aiTools,
  ...lifeTools,
  ...mediaTools,
  ...funTools,
];
