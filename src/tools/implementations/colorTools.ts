import type { ToolOutput } from '@/types';

export async function colorPicker(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const color = (input.color as string) || '#00E5A0';
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rNorm) h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
      else if (max === gNorm) h = ((bNorm - rNorm) / d + 2) / 6;
      else h = ((rNorm - gNorm) / d + 4) / 6;
    }
    const c = 1 - Math.abs(2 * l - 1) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    const rr = Math.round((c + m) * 255), gg = Math.round((x + m) * 255), bb = Math.round(m * 255);
    return { success: true, data: { HEX: color, RGB: `rgb(${r}, ${g}, ${b})`, HSL: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`, 亮度: l > 0.6 ? '浅色' : l < 0.4 ? '深色' : '中等', 提示: '可复制各格式值用于代码或设计中' } };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

export async function gradientGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const color1 = (input.color1 as string) || '#6366f1';
    const color2 = (input.color2 as string) || '#ec4899';
    const angle = Number(input.angle) || 135;
    const css = `background: linear-gradient(${angle}deg, ${color1}, ${color2});`;
    const hex1 = color1.replace('#', ''), hex2 = color2.replace('#', '');
    const r1 = parseInt(hex1.substring(0, 2), 16), g1 = parseInt(hex1.substring(2, 4), 16), b1 = parseInt(hex1.substring(4, 6), 16);
    const r2 = parseInt(hex2.substring(0, 2), 16), g2 = parseInt(hex2.substring(2, 4), 16), b2 = parseInt(hex2.substring(4, 6), 16);
    const midR = Math.round((r1 + r2) / 2).toString(16).padStart(2, '0');
    const midG = Math.round((g1 + g2) / 2).toString(16).padStart(2, '0');
    const midB = Math.round((b1 + b2) / 2).toString(16).padStart(2, '0');
    return { success: true, data: { CSS代码: css, 起始色: color1, 结束色: color2, 渐变角度: `${angle}°`, 中间色: `#${midR}${midG}${midB}`, 提示: '复制CSS代码即可在网页中使用渐变色' } };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

export async function paletteGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const baseColor = (input.baseColor as string) || '#6366f1';
    const scheme = (input.scheme as string) || 'analogous';
    const hex = baseColor.replace('#', '');
    const expandedHex = hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] : hex;
    const r = parseInt(expandedHex.substring(0, 2), 16), g = parseInt(expandedHex.substring(2, 4), 16), b = parseInt(expandedHex.substring(4, 6), 16);
    const toHex = (rr: number, gg: number, bb: number) => '#' + [rr, gg, bb].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const hslFromRgb = (rr: number, gg: number, bb: number) => {
      const rn = rr / 255, gn = gg / 255, bn = bb / 255;
      const mx = Math.max(rn, gn, bn), mn = Math.min(rn, gn, bn);
      let hh = 0; const ll = (mx + mn) / 2;
      if (mx !== mn) {
        const d = mx - mn;
        const ss = ll > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === rn) hh = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        else if (mx === gn) hh = ((bn - rn) / d + 2) * 60;
        else hh = ((rn - gn) / d + 4) * 60;
        return { h: hh, s: ss, l: ll };
      }
      return { h: hh, s: 0, l: ll };
    };
    const { h, s, l } = hslFromRgb(r, g, b);
    const results: string[] = [toHex(r, g, b)];
    if (scheme === 'analogous') {
      for (let i = -30; i <= 30; i += 15) {
        if (i === 0) continue;
        const nh = (h + i + 360) % 360;
        const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((nh / 60) % 2 - 1)), m = l - c / 2;
        if (nh < 60) results.push(toHex((c + m) * 255, (x + m) * 255, m * 255));
        else if (nh < 120) results.push(toHex((x + m) * 255, (c + m) * 255, m * 255));
        else if (nh < 180) results.push(toHex(m * 255, (c + m) * 255, (x + m) * 255));
        else if (nh < 240) results.push(toHex(m * 255, (x + m) * 255, (c + m) * 255));
        else if (nh < 300) results.push(toHex((x + m) * 255, m * 255, (c + m) * 255));
        else results.push(toHex((c + m) * 255, m * 255, (x + m) * 255));
      }
    } else if (scheme === 'complementary') {
      const nh = (h + 180) % 360;
      const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((nh / 60) % 2 - 1)), m = l - c / 2;
      results.push(toHex((c + m) * 255, (x + m) * 255, m * 255));
    } else {
      for (let i = 0; i < 4; i++) {
        const nh = (h + i * 90) % 360, nl = Math.max(0.1, Math.min(0.9, l + (i - 1.5) * 0.1));
        const nc = (1 - Math.abs(2 * nl - 1)) * s, nx = nc * (1 - Math.abs((nh / 60) % 2 - 1)), nm = nl - nc / 2;
        results.push(toHex((nc + nm) * 255, (nx + nm) * 255, nm * 255));
      }
    }
    return { success: true, data: { 基色: baseColor, 方案: scheme === 'analogous' ? '邻近色' : scheme === 'complementary' ? '互补色' : '分裂互补', 配色方案: results.join(', '), 提示: '每组配色包含5个颜色，可用于UI设计配色参考' } };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

export async function colorFormatConvert(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const value = input.value as string;
    const from = input.from as string;
    if (!value) return { success: false, error: '请输入颜色值' };
    let r = 0, g = 0, b = 0;
    if (from === 'hex') {
      const h = value.replace('#', '');
      const eh = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
      r = parseInt(eh.substring(0, 2), 16); g = parseInt(eh.substring(2, 4), 16); b = parseInt(eh.substring(4, 6), 16);
    } else if (from === 'rgb') {
      const m = value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      if (!m) return { success: false, error: 'RGB格式无效，例: 255, 0, 0' };
      r = parseInt(m[1]); g = parseInt(m[2]); b = parseInt(m[3]);
    } else if (from === 'hsl') {
      const m = value.match(/(\d+)[,\s]+(\d+)%[,\s]+(\d+)%/);
      if (!m) return { success: false, error: 'HSL格式无效，例: 0, 100%, 50%' };
      const hh = parseInt(m[1]) / 360, ss = parseInt(m[2]) / 100, ll = parseInt(m[3]) / 100;
      if (ss === 0) { r = g = b = Math.round(ll * 255); }
      else {
        const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
        const p = 2 * ll - q;
        const hue2rgb = (t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
        r = Math.round(hue2rgb(hh + 1/3) * 255); g = Math.round(hue2rgb(hh) * 255); b = Math.round(hue2rgb(hh - 1/3) * 255);
      }
    }
    const hex = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    return { success: true, data: { HEX: hex, RGB: `rgb(${r}, ${g}, ${b})`, 红色: String(r), 绿色: String(g), 蓝色: String(b) } };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

export async function imageColorExtract(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.image as File;
    if (!file) return { success: false, error: '请上传图片' };
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url; });
    const canvas = document.createElement('canvas');
    const size = Math.min(img.width, img.height, 100);
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    URL.revokeObjectURL(url);
    const colorMap: Record<string, number> = {};
    for (let i = 0; i < imageData.data.length; i += 4) {
      const rr = imageData.data[i], gg = imageData.data[i + 1], bb = imageData.data[i + 2];
      const bucket = `${Math.round(rr / 32) * 32},${Math.round(gg / 32) * 32},${Math.round(bb / 32) * 32}`;
      colorMap[bucket] = (colorMap[bucket] || 0) + 1;
    }
    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const colors = sorted.map(([key]) => {
      const [rr, gg, bb] = key.split(',').map(Number);
      return '#' + [rr, gg, bb].map(v => v.toString(16).padStart(2, '0')).join('');
    });
    return { success: true, data: { 主色调: colors.join(', '), 颜色数量: String(colors.length), 提示: '提取了图片中最主要的5个颜色' } };
  } catch (e) { return { success: false, error: `提取失败: ${(e as Error).message}` }; }
}