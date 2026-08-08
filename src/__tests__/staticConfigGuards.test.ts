import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { categories } from '@/tools/categories';
import { builtInTools } from '@/tools';

/**
 * 静态资源 / 配置层的回归守卫（A5 noscript、A6 CSP、A8 中文字体栈、
 * A10 prefers-reduced-motion、A12 focus-visible、C1 死代码、C3 分类描述）。
 *
 * 这些改动落在 index.html / index.css / 数据文件里，跑不进组件测试，
 * 但恰恰最容易在后续改版中被顺手删掉，所以在源码层钉死。
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..'); // src/__tests__ → 仓库根
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf-8');
const indexCss = readFileSync(resolve(root, 'src/index.css'), 'utf-8');

/** 从 index.html 里取出 CSP 的 content 文本。 */
function cspContent(): string {
  const match = indexHtml.match(
    /http-equiv="Content-Security-Policy"[\s\S]*?content="([\s\S]*?)"/,
  );
  if (!match) throw new Error('index.html 中未找到 CSP meta');
  return match[1].replace(/\s+/g, ' ').trim();
}

describe('A5 noscript 兜底', () => {
  it('index.html 存在 noscript 提示', () => {
    expect(indexHtml).toContain('<noscript>');
    expect(indexHtml).toContain('本站需要 JavaScript 才能运行');
  });

  it('提示里说明了「本地计算」的原因，而不是空喊一句「请开启 JS」', () => {
    const noscript = indexHtml.slice(
      indexHtml.indexOf('<noscript>'),
      indexHtml.indexOf('</noscript>'),
    );
    expect(noscript).toContain('本地计算');
    expect(noscript).toContain('刷新');
  });
});

describe('A6 CSP', () => {
  const csp = cspContent();

  it('存在 CSP meta 且声明了 default-src', () => {
    expect(csp).toContain("default-src 'self'");
  });

  it.each([
    ["script-src 保留 'unsafe-eval'（CalculatorUI/Developer/lifeTools 用了 new Function）", "unsafe-eval"],
    ["script-src 保留 'unsafe-inline'（OutputModal 的 srcdoc iframe 继承父页 CSP）", "unsafe-inline"],
  ])('%s', (_label, token) => {
    const scriptSrc = csp.match(/script-src[^;]*/)?.[0] ?? '';
    expect(scriptSrc).toContain(token);
  });

  it('worker-src 放行 blob:（pdfjs 在部分路径下退化成 blob worker）', () => {
    const workerSrc = csp.match(/worker-src[^;]*/)?.[0] ?? '';
    expect(workerSrc).toContain('blob:');
  });

  it('img-src / media-src 放行 data: 与 blob:（canvas.toDataURL / createObjectURL）', () => {
    for (const directive of ['img-src', 'media-src']) {
      const value = csp.match(new RegExp(`${directive}[^;]*`))?.[0] ?? '';
      expect(value, `${directive} 需要 data:`).toContain('data:');
      expect(value, `${directive} 需要 blob:`).toContain('blob:');
    }
  });

  it('frame-src 能覆盖意见箱的第三方表单域名', () => {
    const frameSrc = csp.match(/frame-src[^;]*/)?.[0] ?? '';
    // 当前实现用 `https:` 通配放行（见 index.html 注释：地址来自 .env，写死域名会白屏）
    const coversFeedback =
      frameSrc.includes('https:') ||
      (frameSrc.includes('jsjform.com') && frameSrc.includes('jinshuju.net'));
    expect(coversFeedback, `frame-src 未覆盖意见箱域名：${frameSrc}`).toBe(true);
  });

  it('connect-src 放行 ws:/wss:（这份 meta 在 dev 下同样生效，否则打断 Vite HMR）', () => {
    const connectSrc = csp.match(/connect-src[^;]*/)?.[0] ?? '';
    expect(connectSrc).toContain('ws:');
    expect(connectSrc).toContain('wss:');
  });

  it('保留零风险收紧项：object-src none / base-uri self / form-action self', () => {
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });
});

describe('A8 中文字体栈', () => {
  const CJK_FONTS = ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC'];

  it.each(['--font-heading', '--font-body'])('%s 包含中文字体回退', (varName) => {
    const line = indexCss.split('\n').find((l) => l.includes(varName)) ?? '';
    expect(line, `${varName} 未定义`).not.toBe('');
    for (const font of CJK_FONTS) {
      expect(line, `${varName} 缺少「${font}」`).toContain(font);
    }
  });
});

describe('A10 prefers-reduced-motion', () => {
  const block = (() => {
    const start = indexCss.indexOf('@media (prefers-reduced-motion: reduce)');
    return start === -1 ? '' : indexCss.slice(start, start + 1200);
  })();

  it('存在 prefers-reduced-motion: reduce 媒体查询', () => {
    expect(block).not.toBe('');
  });

  it('把动画与过渡压到近乎为 0', () => {
    expect(block).toMatch(/animation-duration:\s*0\.01ms/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms/);
  });

  it('保留 .animate-spin（加载指示器不能被静止，否则用户以为卡死）', () => {
    expect(block).toContain('.animate-spin');
  });
});

describe('A12 focus-visible', () => {
  it('outline 加粗到 3px 并带外发光', () => {
    const start = indexCss.indexOf(':focus-visible {');
    const block = indexCss.slice(start, start + 400);
    expect(block).toMatch(/outline:[^;]*3px/);
    expect(block).toMatch(/box-shadow:[^;]*rgb\(var\(--accent-rgb\)/);
  });

  it('深浅两套主题各自定义外发光透明度', () => {
    expect(indexCss).toMatch(/:focus-visible\s*\{[\s\S]{0,300}?0\.28\)/);
    expect(indexCss).toMatch(/html\.light :focus-visible\s*\{[\s\S]{0,300}?0\.22\)/);
  });
});

describe('C1 死代码清理', () => {
  it('工具总数为 66 且 id 无重复', () => {
    expect(builtInTools).toHaveLength(66);
    const ids = builtInTools.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每个工具的 category 都能在 categories 里找到', () => {
    const known = new Set(categories.map((c) => c.id));
    const orphans = builtInTools.filter((t) => !known.has(t.category)).map((t) => t.id);
    expect(orphans).toEqual([]);
  });
});

describe('C3 分类描述', () => {
  it('五个分类齐全，id / order 未被改动', () => {
    expect(categories).toHaveLength(5);
    expect(categories.map((c) => c.id)).toEqual([
      'everyday',
      'finance',
      'health',
      'image',
      'fun',
    ]);
    expect(categories.map((c) => c.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('每个分类都有非空描述', () => {
    for (const cat of categories) {
      expect(cat.description.trim().length, `${cat.id} 描述为空`).toBeGreaterThan(0);
    }
  });

  it('描述不再提及本站并不存在的能力（汇率 / OCR）', () => {
    for (const cat of categories) {
      expect(cat.description, `${cat.id} 不应提及「汇率」`).not.toContain('汇率');
      expect(cat.description, `${cat.id} 不应提及「OCR」`).not.toContain('OCR');
    }
  });

  it('每个分类下都确实有工具（描述不能描述一个空分类）', () => {
    for (const cat of categories) {
      const count = builtInTools.filter((t) => t.category === cat.id).length;
      expect(count, `分类 ${cat.id} 下没有任何工具`).toBeGreaterThan(0);
    }
  });
});
