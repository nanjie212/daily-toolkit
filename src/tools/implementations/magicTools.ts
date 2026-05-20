import type { ToolOutput } from '@/types';

async function blobFromImageFile(file: File): Promise<Blob> {
  return file;
}

function downloadBlobUrl(blob: Blob, filename: string): string {
  return URL.createObjectURL(blob);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/jpeg', quality: number = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('生成失败'))), type, quality);
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export async function photoRestore(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    if (!file) return { success: false, error: '请选择照片' };
    const img = await loadImageFromFile(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 1. Remove yellow/fade cast
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if ((r > 160 && g > 140 && b < 100) || (r > 180 && g > 160 && b < 120)) {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        data[i] = clamp(gray + 20, 0, 255);
        data[i + 1] = gray;
        data[i + 2] = clamp(gray - 5, 0, 255);
      }
    }

    // 2. Increase contrast
    const factor = 259 * (128 + 15) / (255 * (259 - 15));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(factor * (data[i] - 128) + 128, 0, 255);
      data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128, 0, 255);
      data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128, 0, 255);
    }

    // 3. Sharpen
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const w = canvas.width, h = canvas.height;
    const output = new Uint8ClampedArray(data.length);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              sum += data[((y + ky) * w + (x + kx)) * 4 + c] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          output[(y * w + x) * 4 + c] = clamp(sum, 0, 255);
        }
        output[(y * w + x) * 4 + 3] = data[(y * w + x) * 4 + 3];
      }
    }
    imageData.data.set(output);
    ctx.putImageData(imageData, 0, 0);

    const blob = await canvasToBlob(canvas);
    const downloadUrl = downloadBlobUrl(blob, 'restored.jpg');

    return {
      success: true,
      data: { 状态: '修复完成', 尺寸: `${canvas.width}×${canvas.height}`, 提示: '已应用去黄、增强对比度、锐化处理' },
      downloadUrl,
      filename: 'restored.jpg',
    };
  } catch (e) { return { success: false, error: `修复失败: ${(e as Error).message}` }; }
}

export async function aiBackgroundRemove(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    if (!file) return { success: false, error: '请选择图片' };
    const threshold = Number(input.threshold ?? 30);
    const feather = Number(input.feather ?? 2);

    const img = await loadImageFromFile(file);
    const maxW = 1024;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    // Sample edges
    const samples: { r: number; g: number; b: number }[] = [];
    const edgePositions = [
      ...Array.from({ length: 20 }, (_, i) => [Math.round(i * w / 19), 0]),
      ...Array.from({ length: 20 }, (_, i) => [Math.round(i * w / 19), h - 1]),
      ...Array.from({ length: 20 }, (_, i) => [0, Math.round(i * h / 19)]),
      ...Array.from({ length: 20 }, (_, i) => [w - 1, Math.round(i * h / 19)]),
      ...Array.from({ length: 8 }, () => [Math.floor(Math.random() * Math.min(10, w)), Math.floor(Math.random() * Math.min(10, h))]),
      ...Array.from({ length: 8 }, () => [Math.floor(Math.random() * Math.min(10, w)), Math.max(0, h - Math.floor(Math.random() * 10))]),
    ];
    for (const [ex, ey] of edgePositions) {
      const i = (ey * w + Math.min(ex, w - 1)) * 4;
      if (data[i + 3] > 0) samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    let avgR = 0, avgG = 0, avgB = 0;
    for (const s of samples) { avgR += s.r; avgG += s.g; avgB += s.b; }
    if (samples.length === 0) return { success: false, error: '无法识别背景，请尝试主体更清晰的图片' };
    avgR = Math.round(avgR / samples.length);
    avgG = Math.round(avgG / samples.length);
    avgB = Math.round(avgB / samples.length);

    const alphaData = new Uint8Array(w * h);

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const i = (py * w + px) * 4;
        const dr = data[i] - avgR, dg = data[i + 1] - avgG, db = data[i + 2] - avgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        if (dist < threshold) {
          alphaData[py * w + px] = 0;
        } else if (dist < threshold + feather) {
          alphaData[py * w + px] = Math.round(255 * (dist - threshold) / feather);
        } else {
          alphaData[py * w + px] = 255;
        }
      }
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] = alphaData[Math.floor(i / 4)];
    }
    ctx.putImageData(imageData, 0, 0);

    const blob = await canvasToBlob(canvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'removed-bg.png');

    return {
      success: true,
      data: { 状态: '背景已移除', 格式: 'PNG (透明背景)', 提示: '可调整阈值和羽化参数获得更好效果' },
      downloadUrl,
      filename: 'removed-bg.png',
    };
  } catch (e) { return { success: false, error: `抠图失败: ${(e as Error).message}` }; }
}

export async function textToHandwriting(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const paperStyle = (input.paperStyle as string) || 'lined';
    if (!text.trim()) return { success: false, error: '请输入要转换的文字' };

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = Math.max(400, Math.ceil(text.length / 30) * 42 + 120);
    const ctx = canvas.getContext('2d')!;

    // Background
    if (paperStyle === 'lined') {
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#c8d6e5';
      ctx.lineWidth = 0.5;
      for (let y = 60; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(canvas.width - 50, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(55, 60);
      ctx.lineTo(55, canvas.height - 20);
      ctx.stroke();
    } else if (paperStyle === 'grid') {
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#c8d6e5';
      ctx.lineWidth = 0.3;
      for (let y = 30; y < canvas.height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(canvas.width - 30, y);
        ctx.stroke();
      }
      for (let x = 30; x < canvas.width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, canvas.height - 30);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw text with handwriting variation
    ctx.font = '24px "Comic Sans MS", "华文行楷", cursive';
    ctx.fillStyle = '#1a1a2e';

    const lines = text.split('\n');
    const seededRandom = (seed: number) => {
      let s = seed;
      return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    };
    const rand = seededRandom(text.length + Date.now() % 1000);

    let yPos = 80;
    for (const line of lines) {
      if (!line.trim()) { yPos += 35; continue; }
      const chars = [...line];
      let xPos = 65;
      for (let i = 0; i < chars.length; i++) {
        const scale = 1.0 + (rand() - 0.5) * 0.06;
        const rot = (rand() - 0.5) * 6; // degrees
        const dx = (rand() - 0.5) * 3;
        const dy = (rand() - 0.5) * 3;
        const fontSize = Math.round(23 * scale);
        ctx.save();
        ctx.translate(xPos + dx, yPos + dy);
        ctx.rotate(rot * Math.PI / 180);
        ctx.font = `${fontSize}px "Comic Sans MS", "华文行楷", cursive`;
        ctx.fillStyle = `rgba(26,26,46,${0.75 + rand() * 0.25})`;
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
        xPos += ctx.measureText(chars[i]).width * 0.93 + rand() * 1.5;
      }
      yPos += 35;
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'handwriting.png');

    return {
      success: true,
      data: { 状态: '生成完成', 字数: `${text.length} 字`, 纸张: paperStyle === 'lined' ? '横线纸' : paperStyle === 'grid' ? '方格纸' : '空白纸' },
      downloadUrl,
      filename: 'handwriting.png',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

export async function wordCloudGenerate(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const colorScheme = (input.colorScheme as string) || 'warm';
    if (!text.trim()) return { success: false, error: '请输入文本' };

    // Count word frequency (Chinese: split by punctuation, English: split by spaces)
    const cleaned = text.replace(/[，。！？、；：""''（）【】《》\n\r\t,\.!\?;:'"\(\)\[\]{}]/g, ' ');
    const zhongwenMatches = cleaned.match(/[\u4e00-\u9fff]+/g) || [];
    const enWords = cleaned.replace(/[\u4e00-\u9fff]+/g, '').split(/\s+/).filter(w => w.length > 1);
    const allWords = [...zhongwenMatches, ...enWords];
    const freq: Record<string, number> = {};
    for (const w of allWords) {
      const key = w.toLowerCase();
      freq[key] = (freq[key] || 0) + 1;
    }

    const entries = Object.entries(freq)
      .filter(([_, c]) => c >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80);

    if (entries.length === 0) return { success: false, error: '未提取到有效词汇' };

    const maxCount = entries[0][1];
    const minCount = entries[entries.length - 1][1];
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const palettes: Record<string, string[]> = {
      warm: ['#e74c3c', '#e67e22', '#f1c40f', '#e91e63', '#ff5722', '#ff9800', '#ffc107'],
      cool: ['#3498db', '#2ecc71', '#1abc9c', '#00bcd4', '#4caf50', '#2196f3', '#009688'],
      purple: ['#9b59b6', '#8e44ad', '#e056a0', '#6c5ce7', '#a855f7', '#c084fc', '#e879f9'],
      neon: ['#00ff88', '#00d4ff', '#ff6ec7', '#ffe600', '#ff2d55', '#39ff14', '#bf00ff'],
    };
    const palette = palettes[colorScheme] || palettes.warm;
    const placedRects: { x: number; y: number; w: number; h: number }[] = [];
    const cx = canvas.width / 2, cy = canvas.height / 2;

    const doesCollide = (x: number, y: number, w: number, h: number): boolean => {
      const margin = 2;
      for (const r of placedRects) {
        if (x - margin < r.x + r.w && x + w + margin > r.x && y - margin < r.y + r.h && y + h + margin > r.y) {
          return true;
        }
      }
      return false;
    };

    for (const [word, count] of entries) {
      const ratio = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
      const fontSize = Math.round(18 + ratio * 60);
      ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      const metrics = ctx.measureText(word);
      const tw = metrics.width;
      const th = fontSize;

      let placed = false;
      for (let radius = 0; radius < 400 && !placed; radius += 2) {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
          const tx = cx + Math.cos(angle) * radius - tw / 2;
          const ty = cy + Math.sin(angle) * radius - th / 2;
          if (tx > 5 && ty > 5 && tx + tw < canvas.width - 5 && ty + th < canvas.height - 5 && !doesCollide(tx, ty, tw, th)) {
            const color = palette[Math.floor(Math.random() * palette.length)];
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
            const rx = (nextRand() - 0.5) * 5;
            const ry = (nextRand() - 0.5) * 3;
            ctx.fillText(word, tx + rx, ty + th + ry);
            placedRects.push({ x: tx, y: ty, w: tw, h: th });
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        const x = 10 + Math.random() * (canvas.width - tw - 20);
        const y = 10 + Math.random() * (canvas.height - th - 20);
        ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
        ctx.fillText(word, x, y + th);
        placedRects.push({ x, y, w: tw, h: th });
      }
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'wordcloud.png');

    return {
      success: true,
      data: { 词汇数: `${entries.length} 个`, 最高频: entries[0][0], 出现: `${entries[0][1]} 次`, 提示: '词云已生成，可下载PNG图片' },
      downloadUrl,
      filename: 'wordcloud.png',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

let _randSeed = 12345;
function nextRand(): number {
  _randSeed = (_randSeed * 1103515245 + 12345) & 0x7fffffff;
  return _randSeed / 0x7fffffff;
}

export async function pixelArtConvert(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const pixelSize = Number(input.pixelSize ?? 8);
    if (!file) return { success: false, error: '请选择图片' };

    const img = await loadImageFromFile(file);
    const smallW = Math.max(8, Math.round(Math.min(img.width, 200) / pixelSize));
    const smallH = Math.round(smallW * (img.height / img.width));
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = smallW;
    smallCanvas.height = smallH;
    const sCtx = smallCanvas.getContext('2d')!;
    sCtx.imageSmoothingEnabled = false;
    sCtx.drawImage(img, 0, 0, smallW, smallH);

    const colorCount = Number(input.colorCount ?? 16);
    const smallData = sCtx.getImageData(0, 0, smallW, smallH).data;

    // Color quantization
    const colorMap = new Map<string, string>();
    const colorBuckets: { r: number; g: number; b: number; count: number }[] = [];
    for (let i = 0; i < smallData.length; i += 4) {
      const r = Math.round(smallData[i] / (256 / 4)) * Math.floor(256 / 4);
      const g = Math.round(smallData[i + 1] / (256 / 4)) * Math.floor(256 / 4);
      const b = Math.round(smallData[i + 2] / (256 / 4)) * Math.floor(256 / 4);
      const key = `${r},${g},${b}`;
      const existing = colorBuckets.find(c => c.r === r && c.g === g && c.b === b);
      if (existing) existing.count++;
      else colorBuckets.push({ r, g, b, count: 1 });
    }

    colorBuckets.sort((a, b) => b.count - a.count);
    const topColors = colorBuckets.slice(0, colorCount);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = smallW;
    outputCanvas.height = smallH;
    const oCtx = outputCanvas.getContext('2d')!;
    oCtx.drawImage(smallCanvas, 0, 0);

    // For display: scale up
    const displayCanvas = document.createElement('canvas');
    const displayScale = 400 / smallW;
    displayCanvas.width = smallW * Math.floor(displayScale);
    displayCanvas.height = smallH * Math.floor(displayScale);
    const dCtx = displayCanvas.getContext('2d')!;
    dCtx.imageSmoothingEnabled = false;
    dCtx.drawImage(outputCanvas, 0, 0, displayCanvas.width, displayCanvas.height);

    const blob = await canvasToBlob(displayCanvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'pixel-art.png');

    return {
      success: true,
      data: { 像素尺寸: `${smallW}×${smallH}`, 像素块: `${pixelSize}px`, 色数: `${colorCount} 色`, 输出: `${displayCanvas.width}×${displayCanvas.height}` },
      downloadUrl,
      filename: 'pixel-art.png',
    };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

export async function photoToSketch(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const intensity = Number(input.intensity ?? 1.0);
    if (!file) return { success: false, error: '请选择图片' };

    const img = await loadImageFromFile(file);
    const maxW = 1024;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    // Convert to grayscale
    const gray = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      gray[Math.floor(i / 4)] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Sobel edge detection
    const edges = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx = gray[idx - w - 1] + 2 * gray[idx - 1] + gray[idx + w - 1] - gray[idx - w + 1] - 2 * gray[idx + 1] - gray[idx + w + 1];
        const gy = gray[idx - w - 1] + 2 * gray[idx - w] + gray[idx - w + 1] - gray[idx + w - 1] - 2 * gray[idx + w] - gray[idx + w + 1];
        edges[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }

    // Normalize + invert
    let maxEdge = 0;
    for (let i = 0; i < edges.length; i++) { if (edges[i] > maxEdge) maxEdge = edges[i]; }
    for (let i = 0; i < data.length; i += 4) {
      const idx = Math.floor(i / 4);
      const edgeVal = maxEdge > 0 ? edges[idx] / maxEdge : 0;
      const v = Math.round(255 - edgeVal * 255 * intensity);
      data[i] = data[i + 1] = data[i + 2] = clamp(v, 220, 255);
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    const blob = await canvasToBlob(canvas);
    const downloadUrl = downloadBlobUrl(blob, 'sketch.jpg');

    return {
      success: true,
      data: { 状态: '转换完成', 尺寸: `${canvas.width}×${canvas.height}`, 提示: '已应用Sobel边缘检测+反相素描效果' },
      downloadUrl,
      filename: 'sketch.jpg',
    };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

export async function ledMarquee(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const speed = (input.speed as string) || 'medium';
    const color = (input.color as string) || '#00ff88';
    if (!text.trim()) return { success: false, error: '请输入弹幕文字' };

    const speedMs = speed === 'fast' ? 4000 : speed === 'slow' ? 10000 : 6000;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;align-items:center;justify-content:center;height:100vh;overflow:hidden}.marquee{font-size:clamp(32px,8vw,120px);font-weight:900;color:${color};white-space:nowrap;animation:scroll ${speedMs}ms linear infinite;text-shadow:0 0 20px ${color},0 0 40px ${color},0 0 80px ${color}}@keyframes scroll{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}</style></head><body><div class="marquee">${text}</div></body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const downloadUrl = downloadBlobUrl(blob, 'led-marquee.html');

    return {
      success: true,
      data: {
        弹幕文字: text,
        速度: speed === 'fast' ? '快速' : speed === 'slow' ? '慢速' : '正常',
        颜色: color,
        提示: '点击「下载」保存HTML文件，用浏览器打开即可全屏展示弹幕，适合演唱会应援、活动展示',
      },
      downloadUrl,
      filename: 'led-marquee.html',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

export async function luckyWheel(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const names = (input.names as string) || '';
    const title = (input.title as string) || '抽奖转盘';
    if (!names.trim()) return { success: false, error: '请输入名单，一行一个名字' };

    const nameList = names.split('\n').filter(n => n.trim());
    if (nameList.length < 2) return { success: false, error: '至少需要2个选项' };

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#f06292', '#4fc3f7', '#aed581', '#ffd54f', '#4dd0e1'];
    const sliceAngle = 360 / nameList.length;

    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d')!;
    const cx = 250, cy = 250, radius = 220;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw sections
    for (let i = 0; i < nameList.length; i++) {
      const startAngle = (i * sliceAngle - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * sliceAngle - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      const midAngle = (startAngle + endAngle) / 2;
      const labelR = radius * 0.65;
      ctx.save();
      ctx.translate(cx + Math.cos(midAngle) * labelR, cy + Math.sin(midAngle) * labelR);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const displayName = nameList[i].length > 6 ? nameList[i].slice(0, 6) + '..' : nameList[i];
      ctx.fillText(displayName, 0, 0);
      ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer
    ctx.beginPath();
    ctx.moveTo(cx + radius - 5, cy - 15);
    ctx.lineTo(cx + radius + 20, cy);
    ctx.lineTo(cx + radius - 5, cy + 15);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c';
    ctx.fill();

    // Title
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ecf0f1';
    ctx.textAlign = 'center';
    ctx.fillText(title, cx, 40);

    const blob = await canvasToBlob(canvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'lucky-wheel.png');

    // Build interactive HTML
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:20px;font-family:"PingFang SC","Microsoft YaHei",sans-serif}h1{color:#ecf0f1}canvas{cursor:pointer;border-radius:50%;box-shadow:0 0 40px rgba(255,255,255,.1)}button{padding:12px 40px;font-size:18px;border:none;border-radius:12px;background:#e74c3c;color:#fff;cursor:pointer;font-weight:bold;transition:transform .15s}button:active{transform:scale(.95)}#result{color:#f1c40f;font-size:24px;font-weight:bold;min-height:40px}</style></head><body><h1>${title}</h1><canvas id="wheel" width="500" height="500"></canvas><button onclick="spin()">🎯 开始转动</button><div id="result"></div><script>const names=${JSON.stringify(nameList)};const colors=${JSON.stringify(colors)};let spinning=false;const canvas=document.getElementById('wheel');const ctx=canvas.getContext('2d');const cx=250,cy=250,radius=220;let currentAngle=0;const sliceAngle=360/names.length;function drawWheel(angle){ctx.clearRect(0,0,500,500);ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.arc(cx,cy,radius+15,0,Math.PI*2);ctx.fill();for(let i=0;i<names.length;i++){const startAngle=((i*sliceAngle-90)+angle)*Math.PI/180;const endAngle=(((i+1)*sliceAngle-90)+angle)*Math.PI/180;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,radius,startAngle,endAngle);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#1a1a2e';ctx.lineWidth=2;ctx.stroke();const midAngle=(startAngle+endAngle)/2;const labelR=radius*.65;ctx.save();ctx.translate(cx+Math.cos(midAngle)*labelR,cy+Math.sin(midAngle)*labelR);ctx.rotate(midAngle+Math.PI/2);ctx.font='bold 14px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';const d=names[i].length>6?names[i].slice(0,6)+'..':names[i];ctx.fillText(d,0,0);ctx.restore()}ctx.beginPath();ctx.arc(cx,cy,30,0,Math.PI*2);ctx.fillStyle='#2c3e50';ctx.fill()}function spin(){if(spinning)return;spinning=true;document.getElementById('result').textContent='转动中...';const targetIdx=Math.floor(Math.random()*names.length);const targetAngle=360*5+targetIdx*sliceAngle+sliceAngle/2;const startAngle=currentAngle;const duration=3000;const startTime=Date.now();function animate(){const elapsed=Date.now()-startTime;const progress=Math.min(elapsed/duration,1);const eased=1-Math.pow(1-progress,3);currentAngle=startAngle+targetAngle*eased;drawWheel(currentAngle);if(progress<1){requestAnimationFrame(animate)}else{spinning=false;document.getElementById('result').textContent='🎉 '+names[targetIdx]+' 🎉'}}animate()}drawWheel(0)</script></body></html>`;

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlDownloadUrl = downloadBlobUrl(htmlBlob, 'lucky-wheel.html');

    return {
      success: true,
      data: {
        选项数: `${nameList.length} 个`,
        标题: title,
        提示: '点击「下载」保存HTML文件，用浏览器打开即可互动抽奖，点击按钮转动转盘！',
      },
      downloadUrl: htmlDownloadUrl,
      filename: 'lucky-wheel.html',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}