import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * B 组回归测试（源码层，不依赖构建产物）。
 *
 * 旧写法把 tailwind 颜色配置成裸 `var(--xx)`，导致全站 128 处 `bg-accent/20`、
 * `focus:ring-accent/30`、`bg-card/90` 等透明度变体**零 CSS 产出**（静默丢弃）。
 *
 * 修复 = 两处配合：
 *   1. tailwind.config.js 颜色写成 `rgb(var(--xx-rgb) / <alpha-value>)`
 *   2. src/index.css 的 :root 与 html.light 同时定义 `--xx-rgb` 通道值（裸 `var(--xx)` 保留不删）
 *
 * 此测试在源码层守住修复，避免有人把颜色改回裸 var 又让透明度变体失效。
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..'); // src/__tests__ → 仓库根
const tailwindConfig = readFileSync(resolve(root, 'tailwind.config.js'), 'utf-8');
const indexCss = readFileSync(resolve(root, 'src/index.css'), 'utf-8');

const THEME_COLORS = ['bg', 'card', 'surface', 'accent'] as const;

describe('Tailwind 主题色透明度变体 (B 组)', () => {
  it('tailwind.config.js 四色均使用 rgb(var(--x-rgb) / <alpha-value>) 写法', () => {
    for (const key of THEME_COLORS) {
      expect(tailwindConfig).toContain(
        `${key}: 'rgb(var(--${key}-rgb) / <alpha-value>)'`,
      );
    }
  });

  it('index.css 的 :root 定义了对应的 -rgb 通道变量', () => {
    for (const key of THEME_COLORS) {
      expect(indexCss).toContain(`--${key}-rgb:`);
    }
  });

  it('index.css 的 html.light 同步覆盖 -rgb（否则变体会沿用深色通道）', () => {
    const lightBlock = indexCss.slice(indexCss.indexOf('html.light'));
    expect(lightBlock).toContain('--bg-rgb:');
    expect(lightBlock).toContain('--card-rgb:');
    expect(lightBlock).toContain('--surface-rgb:');
    expect(lightBlock).toContain('--accent-rgb:');
  });

  it('旧版裸 var(--x) 变量仍保留（组件仍在引用，不可删除）', () => {
    expect(indexCss).toContain('--bg:');
    expect(indexCss).toContain('--card:');
    expect(indexCss).toContain('--surface:');
    expect(indexCss).toContain('--accent:');
  });
});
