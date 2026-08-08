// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import GridItem from '../GridItem';
import type { ToolRecord } from '@/types';
import type { GridSlot, GridTransform } from '@/lib/grid/types';

/**
 * GridItem SSR 渲染验证。
 *
 * 使用 renderToStaticMarkup + MemoryRouter 验证：
 * - 结构存在（图标、名称）
 * - 分类色 class 正确
 * - hasNeighbor 细光线 class 正确
 * - 状态 class 正确映射
 */

function makeTool(overrides: Partial<ToolRecord> = {}): ToolRecord {
  return {
    id: 'test-calc',
    name: '计算器',
    description: '一个测试计算器',
    category: 'everyday',
    icon: 'CalculatorIcon',
    version: '1.0.0',
    source: 'builtin',
    permissions: [],
    inputSchema: [],
    outputFormat: 'text',
    ...overrides,
  };
}

function makeSlot(overrides: Partial<GridSlot> = {}): GridSlot {
  return {
    toolId: 'test-calc',
    categoryId: 'everyday',
    zone: 'top',
    row: 0,
    col: 0,
    cx: 50,
    cy: 50,
    hasNeighborRight: false,
    hasNeighborBelow: false,
    ...overrides,
  };
}

function makeTransform(overrides: Partial<GridTransform> = {}): GridTransform {
  return {
    dx: 0,
    dy: 0,
    scale: 1,
    opacity: 1,
    z: 1,
    state: 'idle',
    ...overrides,
  };
}

const noop = () => {};

function renderGridItem(
  tool: ToolRecord,
  slot: GridSlot,
  transform: GridTransform,
  extra: Partial<{
    isHovered: boolean;
    hasNeighborRight: boolean;
    hasNeighborBelow: boolean;
  }> = {},
): string {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(GridItem, {
        tool,
        slot,
        transform,
        isHovered: extra.isHovered ?? false,
        hasNeighborRight: extra.hasNeighborRight ?? slot.hasNeighborRight,
        hasNeighborBelow: extra.hasNeighborBelow ?? slot.hasNeighborBelow,
        itemW: 76,
        itemH: 68,
        onHover: noop,
        onLeave: noop,
        onActivate: noop,
      }),
    ),
  );
}

describe('GridItem 结构渲染', () => {
  const tool = makeTool();
  const slot = makeSlot();
  const transform = makeTransform();
  const html = renderGridItem(tool, slot, transform);

  it('渲染 tool name（计算器）', () => {
    expect(html).toContain('计算器');
  });

  it('渲染 aria-label 包含工具名', () => {
    expect(html).toContain('aria-label="计算器"');
  });

  it('渲染分类色 class（everyday → grid-item--cat-everyday）', () => {
    expect(html).toContain('grid-item--cat-everyday');
  });

  it('渲染按钮（grid-item__chip）', () => {
    expect(html).toContain('grid-item__chip');
  });

  it('渲染图标容器（grid-item__icon）', () => {
    expect(html).toContain('grid-item__icon');
  });

  it('渲染名称容器（grid-item__name）', () => {
    expect(html).toContain('grid-item__name');
  });

  it('默认无状态 class（idle 不产出 class）', () => {
    expect(html).not.toContain('grid-item--hovered');
    expect(html).not.toContain('grid-item--matched');
    expect(html).not.toContain('grid-item--pushed');
    expect(html).not.toContain('grid-item--dimmed');
  });
});

describe('GridItem 状态 class', () => {
  const tool = makeTool();
  const slot = makeSlot();

  it('matched 状态渲染 grid-item--matched', () => {
    const t = makeTransform({ state: 'matched' });
    const html = renderGridItem(tool, slot, t);
    expect(html).toContain('grid-item--matched');
  });

  it('hovered 状态渲染 grid-item--hovered', () => {
    const t = makeTransform({ state: 'hovered' });
    const html = renderGridItem(tool, slot, t);
    expect(html).toContain('grid-item--hovered');
  });

  it('pushed 状态渲染 grid-item--pushed', () => {
    const t = makeTransform({ state: 'pushed', dx: 6, dy: 0 });
    const html = renderGridItem(tool, slot, t);
    expect(html).toContain('grid-item--pushed');
  });

  it('dimmed 状态渲染 grid-item--dimmed', () => {
    const t = makeTransform({ state: 'dimmed', opacity: 0.35, scale: 0.94 });
    const html = renderGridItem(tool, slot, t);
    expect(html).toContain('grid-item--dimmed');
  });
});

describe('GridItem 细光线（邻居关系）', () => {
  const tool = makeTool();
  const slot = makeSlot();
  const transform = makeTransform();

  it('hasNeighborRight=true 渲染 grid-item--ray-right', () => {
    const s = makeSlot({ hasNeighborRight: true, col: 0 });
    const html = renderGridItem(tool, s, transform, { hasNeighborRight: true });
    expect(html).toContain('grid-item--ray-right');
  });

  it('hasNeighborBelow=true 渲染 grid-item--ray-below', () => {
    const s = makeSlot({ hasNeighborBelow: true, row: 0 });
    const html = renderGridItem(tool, s, transform, { hasNeighborBelow: true });
    expect(html).toContain('grid-item--ray-below');
  });

  it('同时有右侧和下方邻居时两个 class 都渲染', () => {
    const s = makeSlot({ hasNeighborRight: true, hasNeighborBelow: true });
    const html = renderGridItem(tool, s, transform, {
      hasNeighborRight: true,
      hasNeighborBelow: true,
    });
    expect(html).toContain('grid-item--ray-right');
    expect(html).toContain('grid-item--ray-below');
  });

  it('无邻居时不渲染细光线 class', () => {
    const html = renderGridItem(tool, slot, transform);
    expect(html).not.toContain('grid-item--ray-right');
    expect(html).not.toContain('grid-item--ray-below');
  });
});

describe('GridItem 分类色覆盖', () => {
  const transform = makeTransform();
  const slot = makeSlot();

  it('finance 分类渲染 grid-item--cat-finance', () => {
    const t = makeTool({ id: 'test-fin', category: 'finance', icon: 'DollarSignIcon' });
    const s = makeSlot({ toolId: 'test-fin', categoryId: 'finance' });
    const html = renderGridItem(t, s, transform);
    expect(html).toContain('grid-item--cat-finance');
  });

  it('fun 分类渲染 grid-item--cat-fun', () => {
    const t = makeTool({ id: 'test-fun', category: 'fun', icon: 'SmileIcon' });
    const s = makeSlot({ toolId: 'test-fun', categoryId: 'fun' });
    const html = renderGridItem(t, s, transform);
    expect(html).toContain('grid-item--cat-fun');
  });
});
