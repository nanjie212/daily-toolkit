import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { resolveGridBreakpoint } from '@/lib/grid/constants';
import type { GridBreakpoint } from '@/lib/grid/types';

/** 尺寸量化桶：ResizeObserver 回调里先取整到 40px 再 setState，避免拖拽窗口时每像素重算 */
const BUCKET_PX = 40;

export interface StageMetrics {
  /** 舞台可用尺寸（px，宽高均已量化到 40px 桶） */
  stage: { width: number; height: number };
  /** 断点：sm = <768 降级；md = ≥768；lg = ≥1024；xl = ≥1280 */
  breakpoint: GridBreakpoint;
  /** 系统是否开启「减少动态效果」 */
  reducedMotion: boolean;
  /** 首次测量完成前为 false（避免 0×0 布局闪烁；SSR / 无 ResizeObserver 环境下保持 false） */
  ready: boolean;
}

/**
 * 用 ResizeObserver 观测容器尺寸，输出量化的舞台尺寸与断点。
 *
 * - 宽高量化到 40px 桶后才 setState，避免拖动窗口时每像素重算布局。
 * - 顺带用 matchMedia 探测 `prefers-reduced-motion`，供排斥内核关位移。
 * - 卸载时 disconnect；SSR（node / renderToStaticMarkup）下 effect 不执行，返回 ready=false。
 *
 * @param ref 要观测的容器 ref（通常是 orbit-stage 的外层 div）
 */
export function useStageMetrics(ref: RefObject<HTMLElement | null>): StageMetrics {
  const [stage, setStage] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const quantize = (v: number) => Math.max(0, Math.round(v / BUCKET_PX) * BUCKET_PX);

    const update = () => {
      const rect = el.getBoundingClientRect();
      setStage({ width: quantize(rect.width), height: quantize(rect.height) });
      setReady(true);
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();

    let mq: MediaQueryList | undefined;
    const onMqChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      mq.addEventListener('change', onMqChange);
    }

    return () => {
      observer.disconnect();
      mq?.removeEventListener?.('change', onMqChange);
    };
  }, [ref]);

  return {
    stage,
    breakpoint: resolveGridBreakpoint(stage.width),
    reducedMotion,
    ready,
  };
}
