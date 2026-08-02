// 零依赖：把工具结果渲染成分享卡片 PNG 并下载 / 复制到剪贴板。
// 纯浏览器实现：SVG -> Image -> canvas -> toBlob，不引入任何外部库。
// 增强：在卡片中部展示工具运行成果预览，并在右下角嵌入工具二维码。

import QRCode from 'qrcode';
import type { ToolOutput } from '@/types';

/** 部署后的主站默认域名（阶段一未知最终域名，做成可配置项，见 exportShareCard 的 baseUrl）。 */
const DEFAULT_BASE_URL = 'https://6c9131a380b24cd08741384565831c9b.bj9.agentos-app.net';

export interface ShareCardOptions {
  title: string;
  toolId?: string;
  toolName?: string;
  /** 文字列表（可选）。不传时自动从 output 提取精简摘要（最多 7 行）。 */
  lines?: string[];
  /** 工具运行结果，用于在卡片中部渲染成果预览。 */
  output?: ToolOutput;
  /** 二维码目标链接；不传时退回 baseUrl + /#/tool/{toolId}。用于把二维码指向当前实际页面（双保险）。 */
  url?: string;
  accent?: string;
  /** 二维码主站基址，默认 DEFAULT_BASE_URL；调用方可传 window.location.origin 自动适配当前域名。 */
  baseUrl?: string;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 把 #RRGGBB 叠加 alpha 转为 rgba()，兼容更多 SVG 渲染环境。 */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 千分位 + 保留货币符号，用于高亮数值展示。 */
function formatNumber(s: string): string {
  const m = s.match(/([¥￥$€£])/);
  const sym = m ? m[1] : '';
  const numStr = s.replace(/[¥￥$€£,\s]/g, '');
  const n = parseFloat(numStr);
  if (!isNaN(n) && numStr.length > 0) {
    const parts = String(n).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sym + parts.join('.');
  }
  return s;
}

function isObjectData(d: unknown): d is Record<string, unknown> {
  return !!d && typeof d === 'object' && !Array.isArray(d);
}

/** 提取图片 URL：data:image 字符串，或图片类 downloadUrl。 */
function getImageUrl(output: ToolOutput): string | null {
  if (typeof output.data === 'string' && output.data.startsWith('data:image')) return output.data;
  if (output.downloadUrl && /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(output.downloadUrl)) {
    return output.downloadUrl;
  }
  return null;
}

function isHtmlOutput(output: ToolOutput): boolean {
  if (output.type === 'html') return true;
  return typeof output.data === 'string' && (output.data.includes('<!DOCTYPE') || /^\s*<html|<div|<p\b/i.test(output.data));
}

/** 优先挑含关键字的字段做高亮，其次挑第一个数值字段。 */
function findHighlightEntry(entries: [string, unknown][]): [string, string] | null {
  const priority = ['结果', '到手', '总分', '得分', '金额', '省'];
  for (const kw of priority) {
    const found = entries.find(([k]) => k.includes(kw));
    if (found) return [found[0], String(found[1])];
  }
  const numeric = entries.find(([, v]) => {
    const s = String(v).replace(/[¥￥$€£%,，\s]/g, '');
    return s.length > 0 && !isNaN(parseFloat(s));
  });
  return numeric ? [numeric[0], String(numeric[1])] : null;
}

/** 自动从 output 生成精简文字列表（最多 7 行）。 */
function buildLines(opts: ShareCardOptions): string[] {
  if (opts.lines && opts.lines.length) return opts.lines;
  const output = opts.output;
  if (!output) return [];
  if (typeof output.data === 'string') {
    if (output.data.startsWith('data:image') || isHtmlOutput(output)) return [];
    return output.data
      .replace(/\r/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }
  if (isObjectData(output.data)) {
    return Object.entries(output.data)
      .filter(([k]) => k !== 'type' && k !== '提示')
      .map(([k, v]) => `${k}：${String(v)}`);
  }
  if (output.error) return [output.error];
  return [];
}

/** 加载图片以获取自然尺寸，用于 cover 裁剪。 */
function loadImageSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = url;
  });
}

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 渲染文本成果预览（自适应英雄区块高度，铺满主视觉区）。 */
function renderTextPreview(text: string, region: Region, accent: string): string {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const padX = 48;
  let svg = `<rect x="${region.x}" y="${region.y}" width="${region.w}" height="${region.h}" rx="24" fill="#111118" stroke="${withAlpha(accent, 0.13)}" stroke-width="2"/>`;
  if (lines.length === 0) {
    svg += `<text x="${region.x + region.w / 2}" y="${region.y + region.h / 2}" text-anchor="middle" fill="#6B7280" font-size="38" font-family="sans-serif">（无文本内容）</text>`;
    return svg;
  }
  const available = region.h - padX * 2;
  const maxRows = 14;
  const lh = Math.min(64, Math.floor(available / maxRows));
  const showCount = Math.min(lines.length, Math.floor(available / lh));
  const overflow = lines.length > showCount;
  const startY = region.y + padX + lh - 10;
  lines.slice(0, showCount).forEach((l, i) => {
    let content = truncate(l, 32);
    if (overflow && i === showCount - 1) content = truncate(l, 28) + '…';
    svg += `<text x="${region.x + padX}" y="${startY + i * lh}" fill="#E5E7EB" font-size="40" font-family="sans-serif">${escapeXml(content)}</text>`;
  });
  return svg;
}

/** 渲染信息类预览（如 HTML 产出 fallback）。 */
function renderInfoPreview(region: Region, title: string, sub: string, accent: string): string {
  let svg = `<rect x="${region.x}" y="${region.y}" width="${region.w}" height="${region.h}" rx="24" fill="#111118" stroke="${withAlpha(accent, 0.13)}" stroke-width="2"/>`;
  svg += `<text x="${region.x + region.w / 2}" y="${region.y + region.h / 2 - 6}" text-anchor="middle" fill="${accent}" font-size="48" font-weight="bold" font-family="sans-serif">${escapeXml(title)}</text>`;
  if (sub) {
    svg += `<text x="${region.x + region.w / 2}" y="${region.y + region.h / 2 + 44}" text-anchor="middle" fill="#6B7280" font-size="30" font-family="sans-serif">${escapeXml(truncate(sub, 30))}</text>`;
  }
  return svg;
}

/** 渲染对象（key-value）成果预览：高亮结果卡 + 双列小标签（整体垂直居中于英雄区块）。 */
function renderObjectPreview(data: Record<string, unknown>, region: Region, accent: string): string {
  const entries = Object.entries(data).filter(([k]) => k !== 'type' && k !== '提示');
  const highlight = findHighlightEntry(entries);
  const tags = (highlight ? entries.filter(([k]) => k !== highlight[0]) : entries).slice(0, 8);

  const pad = 36;
  const cardH = 168;
  const cardGap = 36;
  const tagRowH = 56;
  const tagRows = Math.ceil(tags.length / 2);
  const blockH = (highlight ? cardH + cardGap : 0) + tagRows * tagRowH;
  let top = region.y + Math.max(pad, Math.round((region.h - blockH) / 2));

  let svg = `<rect x="${region.x}" y="${region.y}" width="${region.w}" height="${region.h}" rx="24" fill="#111118" stroke="${withAlpha(accent, 0.13)}" stroke-width="2"/>`;

  if (highlight) {
    const [hKey, hVal] = highlight;
    const cardX = region.x + pad;
    const cardY = top;
    const cardW = region.w - pad * 2;
    svg += `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="18" fill="${withAlpha(accent, 0.08)}" stroke="${withAlpha(accent, 0.3)}" stroke-width="1.5"/>`;
    svg += `<text x="${cardX + 28}" y="${cardY + 48}" fill="${withAlpha(accent, 0.7)}" font-size="28" font-family="sans-serif">${escapeXml(truncate(hKey, 16))}</text>`;
    svg += `<text x="${cardX + 28}" y="${cardY + 122}" fill="${accent}" font-size="62" font-weight="bold" font-family="sans-serif">${escapeXml(truncate(formatNumber(String(hVal)), 18))}</text>`;
    top += cardH + cardGap;
  }

  const tagStartY = top;
  const colW = (region.w - pad * 2 - 30) / 2;
  tags.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = region.x + pad + col * (colW + 30);
    const ty = tagStartY + row * tagRowH;
    svg += `<text x="${tx}" y="${ty}" font-size="30" font-family="sans-serif"><tspan fill="#6B7280">${escapeXml(truncate(k, 8))}</tspan><tspan fill="#E5E7EB" dx="8">${escapeXml(truncate(String(v), 16))}</tspan></text>`;
  });

  return svg;
}

/** 构建中部的成果预览 SVG 片段。 */
async function buildPreviewSvg(output: ToolOutput, region: Region, accent: string): Promise<string> {
  const imgUrl = getImageUrl(output);
  if (imgUrl) {
    const { w, h } = await loadImageSize(imgUrl);
    const scale = Math.max(region.w / w, region.h / h);
    const dw = w * scale;
    const dh = h * scale;
    const ix = region.x + (region.w - dw) / 2;
    const iy = region.y + (region.h - dh) / 2;
    const href = escapeXml(imgUrl);
    return (
      `<defs><clipPath id="pvClip"><rect x="${region.x}" y="${region.y}" width="${region.w}" height="${region.h}" rx="24"/></clipPath></defs>` +
      `<g clip-path="url(#pvClip)">` +
      `<rect x="${region.x}" y="${region.y}" width="${region.w}" height="${region.h}" fill="#111118"/>` +
      `<image href="${href}" xlink:href="${href}" x="${ix}" y="${iy}" width="${dw}" height="${dh}" preserveAspectRatio="xMidYMid slice"/>` +
      `</g>` +
      `<rect x="${region.x}" y="${region.y}" width="${region.w}" height="${region.h}" rx="24" fill="none" stroke="${withAlpha(accent, 0.13)}" stroke-width="2"/>`
    );
  }

  if (isHtmlOutput(output)) {
    return renderInfoPreview(region, '已生成 HTML 页面', '可在结果区预览与交互', accent);
  }

  if (isObjectData(output.data)) {
    return renderObjectPreview(output.data, region, accent);
  }

  if (typeof output.data === 'string') {
    return renderTextPreview(output.data, region, accent);
  }

  return renderInfoPreview(region, '工具运行成功', '', accent);
}

/** 预览态分类，用于决定英雄区块尺寸与文本行策略。 */
type PreviewKind = 'image' | 'html' | 'object' | 'text' | 'none';

function detectPreviewKind(output: ToolOutput): PreviewKind {
  if (getImageUrl(output)) return 'image';
  if (isHtmlOutput(output)) return 'html';
  if (isObjectData(output.data)) return 'object';
  if (typeof output.data === 'string') return 'text';
  return 'none';
}

export async function exportShareCard(opts: ShareCardOptions): Promise<void> {
  const accent = opts.accent || '#00E5A0';
  const W = 1080;
  const H = 1350;
  const pad = 64;
  const titleSize = 52;
  const lineSize = 30;
  const lineHeight = 52;
  const FALLBACK_MAX = 7;

  // 1) 预览态分类：决定英雄区块尺寸与文本行策略
  const hasOutput = !!opts.output;
  const previewKind: PreviewKind = hasOutput ? detectPreviewKind(opts.output!) : 'none';

  // 2) 文本行策略：
  //    - 有结构化结果(output)时，文本仅作极简点缀：图片/对象/HTML 预览态 0 行，文本预览态最多 2 行。
  //    - 无 output 时，回退展示 opts.lines（最多 7 行），避免卡片读起来像参数清单。
  let outputMax = 2;
  if (previewKind === 'image' || previewKind === 'object' || previewKind === 'html') outputMax = 0;
  const lines: string[] = hasOutput
    ? buildLines(opts).slice(0, outputMax)
    : buildLines(opts).slice(0, FALLBACK_MAX);

  // 3) 标题 + 工具名副标题
  let body =
    '<text x="' + pad + '" y="' + (pad + titleSize) + '" fill="#FFFFFF" font-size="' + titleSize + '" font-weight="bold" font-family="sans-serif">' +
    escapeXml(truncate(opts.title || '工具结果', 18)) +
    '</text>';
  const titleY = pad + titleSize;
  let cursorY = titleY;
  const subtitle = opts.toolName && opts.toolName !== opts.title ? opts.toolName : '';
  if (subtitle) {
    body +=
      '<text x="' + pad + '" y="' + (titleY + 48) + '" fill="#9CA3AF" font-size="30" font-family="sans-serif">' +
      escapeXml(truncate(subtitle, 24)) +
      '</text>';
    cursorY = titleY + 48;
  }

  // 4) 副标题下方的极简文本行（输出态最多 2 行；兜底态最多 7 行）
  lines.forEach((l, i) => {
    const y = cursorY + 48 + i * lineHeight;
    body +=
      '<text x="' + pad + '" y="' + y + '" fill="#E5E7EB" font-size="' + lineSize + '" font-family="sans-serif">' +
      escapeXml(truncate(l, 34)) +
      '</text>';
  });
  if (lines.length) cursorY = cursorY + 48 + (lines.length - 1) * lineHeight;

  // 5) 英雄预览区块：扩大为接近满宽主视觉，底部统一到 1020，给右下角二维码留出 ≥90px 间隙。
  let previewSvg = '';
  if (hasOutput) {
    const previewBottom = 1020;
    const previewTop = lines.length ? Math.max(200, cursorY + 40) : 200;
    const previewRegion: Region = { x: 64, y: previewTop, w: 952, h: previewBottom - previewTop };
    previewSvg = await buildPreviewSvg(opts.output!, previewRegion, accent);
  }

  // 二维码：右下角，白底黑码，与深色卡片形成对比。
  let qrSvg = '';
  const base = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const qrTarget = opts.url || (opts.toolId ? `${base}/#/tool/${opts.toolId}` : '');
  if (qrTarget) {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrTarget, {
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      const qSize = 176;
      const qx = W - pad - qSize;
      const qy = H - 56 - qSize;
      const qrHref = escapeXml(qrDataUrl);
      qrSvg =
        `<rect x="${qx - 12}" y="${qy - 12}" width="${qSize + 24}" height="${qSize + 24}" rx="20" fill="#FFFFFF"/>` +
        `<image href="${qrHref}" xlink:href="${qrHref}" x="${qx}" y="${qy}" width="${qSize}" height="${qSize}" preserveAspectRatio="none"/>` +
        `<text x="${qx - 24}" y="${qy + 40}" text-anchor="end" fill="#6B7280" font-size="26" font-family="sans-serif">扫码</text>` +
        `<text x="${qx - 24}" y="${qy + 80}" text-anchor="end" fill="#6B7280" font-size="26" font-family="sans-serif">使用该工具</text>`;
    } catch {
      // 二维码生成失败不影响卡片主体
    }
  }

  // body 已在上方构建（标题 + 工具名副标题 + 极简文本行）

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
    '<rect width="' + W + '" height="' + H + '" rx="48" fill="#0A0A0F"/>' +
    '<rect x="0" y="0" width="' + W + '" height="16" fill="' + accent + '"/>' +
    body +
    previewSvg +
    qrSvg +
    '<text x="' + pad + '" y="' + (H - 44) + '" fill="#6B7280" font-size="28" font-family="sans-serif">普通日常工具箱</text>' +
    '</svg>';

  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('卡片渲染失败'));
    img.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, W, H);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  if (!blob) throw new Error('生成图片失败');

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (opts.title || 'result') + '-卡片.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  try {
    const ClipboardCtor = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
    if (ClipboardCtor && navigator.clipboard && 'write' in navigator.clipboard) {
      await navigator.clipboard.write([new ClipboardCtor({ 'image/png': blob })]);
    }
  } catch {
    // 剪贴板可能被浏览器策略拦截，不影响下载
  }
}
