import { memo } from 'react';
import type { ToolRecord } from '@/types';
import { getToolIcon } from '@/components/ToolGrid';
import { ENABLE_IDLE_FLOAT, ORBIT_MOTION } from '@/lib/orbit/orbitConstants';
import type { OrbitNode, OrbitTransform } from '@/lib/orbit/types';

export interface OrbitItemProps {
  node: OrbitNode;
  tool: ToolRecord;
  transform: OrbitTransform;
  itemW: number;
  itemH: number;
  /** 入场 stagger 序号 */
  enterIndex: number;
  /** 搜索交互期（searchQuery !== ''）为 true：挂 will-change，结束后移除 */
  interacting?: boolean;
  /** 点击打开工具（必须 useCallback 稳定引用） */
  onActivate: (toolId: string) => void;
}

/**
 * 单个轨道项 —— 三层 DOM（docs/system_design.md §1.2）：
 *
 *   ① 定位层 .orbit-item         left:50%; top:50%; margin:-h/2 0 0 -w/2 定到舞台中心，
 *                                之后只靠 inline transform 摆放（translate3d + scale），
 *                                布局树永不失效；排斥位移 dx/dy 与高亮 scale 都合进这里。
 *   ② 浮动层 .orbit-item__float  独立 transform 上下文，承载 idle 呼吸浮动 keyframe，
 *                                与定位层的 inline transform 互不打架（默认关，见 ENABLE_IDLE_FLOAT）。
 *   ③ chip 层 .orbit-chip        真实按钮，class 驱动发光 / 描边 / 暗淡态。
 *
 * 性能：React.memo + 自定义比较，只有 transform 数值 / state / 基础坐标真变才重渲染。
 */
function OrbitItemInner({
  node,
  tool,
  transform,
  itemW,
  itemH,
  enterIndex,
  interacting = false,
  onActivate,
}: OrbitItemProps) {
  const Icon = getToolIcon(tool.icon);
  const { dx, dy, scale, opacity, z, state } = transform;

  const stateClass =
    state === 'matched'
      ? ' orbit-chip--matched'
      : state === 'pushed'
        ? ' orbit-chip--pushed'
        : state === 'dimmed'
          ? ' orbit-chip--dimmed'
          : '';

  // idle 呼吸浮动默认关；开启时按序号错开 delay，幅度 ±3px（duration 6.5s）
  const floatStyle = ENABLE_IDLE_FLOAT
    ? { animationDelay: `${(enterIndex % 20) * 0.08}s` }
    : undefined;

  return (
    <div
      role="listitem"
      className={`orbit-item${interacting ? ' orbit-item--interacting' : ''}`}
      style={{
        width: itemW,
        height: itemH,
        marginLeft: -itemW / 2,
        marginTop: -itemH / 2,
        transform: `translate3d(${node.bx + dx}px, ${node.by + dy}px, 0) scale(${scale})`,
        opacity,
        zIndex: z,
      }}
    >
      <div
        className={`orbit-item__float${ENABLE_IDLE_FLOAT ? ' orbit-item__float--idle' : ''}`}
        style={floatStyle}
      >
        <button
          type="button"
          onClick={() => onActivate(tool.id)}
          aria-label={`${tool.name}：${tool.description}`}
          className={`orbit-chip${stateClass}`}
          // 入场：opacity+scale 淡入，stagger 由序号决定，只跑一次（React.memo 保证不重挂载）
          style={{
            animationDelay: `${Math.min(enterIndex * ORBIT_MOTION.enterStagger, ORBIT_MOTION.enterStaggerMax)}ms`,
          }}
        >
          <Icon className="orbit-chip__icon" aria-hidden="true" />
          <span className="orbit-chip__name">{tool.name}</span>
        </button>
      </div>
    </div>
  );
}

/** 只比较会影响视觉的字段：transform 四数值 + state、基础坐标、尺寸、回调身份 */
function areOrbitItemPropsEqual(prev: OrbitItemProps, next: OrbitItemProps): boolean {
  return (
    prev.node.bx === next.node.bx &&
    prev.node.by === next.node.by &&
    prev.itemW === next.itemW &&
    prev.itemH === next.itemH &&
    prev.enterIndex === next.enterIndex &&
    prev.interacting === next.interacting &&
    prev.onActivate === next.onActivate &&
    prev.transform.dx === next.transform.dx &&
    prev.transform.dy === next.transform.dy &&
    prev.transform.scale === next.transform.scale &&
    prev.transform.opacity === next.transform.opacity &&
    prev.transform.z === next.transform.z &&
    prev.transform.state === next.transform.state
  );
}

export const OrbitItem = memo(OrbitItemInner, areOrbitItemPropsEqual);
