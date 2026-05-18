import type { ToolRecord } from '@/types';
import { imageTools } from './image';
import { documentTools } from './document';
import { aiTools } from './ai';
import { lifeTools } from './life';
import { mediaTools } from './media';

export const builtInTools: ToolRecord[] = [
  ...imageTools,
  ...documentTools,
  ...aiTools,
  ...lifeTools,
  ...mediaTools,
];
