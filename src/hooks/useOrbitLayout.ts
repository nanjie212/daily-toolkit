import { useMemo } from 'react';
import { computeOrbitLayout } from '@/lib/orbit/layout';
import type { OrbitLayout, OrbitToolInput, StageBox } from '@/lib/orbit/types';

/**
 * 把纯内核 `computeOrbitLayout` 包进 useMemo。
 *
 * 依赖数组只放基本类型（stage.width / stage.height），
 * 保证尺寸未变时不重算布局；tools 引用变化（重载）时才重算。
 */
export function useOrbitLayout(tools: readonly OrbitToolInput[], stage: StageBox): OrbitLayout {
  return useMemo(() => computeOrbitLayout(tools, stage), [tools, stage.width, stage.height]);
}
