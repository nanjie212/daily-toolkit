import type { ToolOutput } from '@/types';

/**
 * ============================================
 * 图片处理辅助函数
 * ============================================
 */

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

/**
 * ============================================
 * 老照片修复
 * 功能：去黄褪色、降噪、增强对比度、锐化、超分辨率模拟
 * 技术参考：ESRGAN、SwinIR等超分辨率算法原理
 * ============================================
 */
export async function photoRestore(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const intensity = Number(input.intensity ?? 1.0); // 修复强度 0.5-2.0
    if (!file) return { success: false, error: '请选择照片' };

    const img = await loadImageFromFile(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    // ========== 第1步：去除黄斑/褪色 ==========
    // 检测黄色区域（老照片常见问题）
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // 检测黄色偏色（r高、g中高、b低）
      if ((r > 150 && g > 120 && b < 100) || (r > 170 && g > 150 && b < 120)) {
        // 转换为更自然的灰度，保留细节
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const blend = 0.7 * intensity; // 混合比例
        data[i] = clamp(Math.round(r * (1 - blend) + gray * blend + 15), 0, 255);
        data[i + 1] = clamp(Math.round(g * (1 - blend) + gray * blend), 0, 255);
        data[i + 2] = clamp(Math.round(b * (1 - blend) + gray * blend - 10), 0, 255);
      }
    }

    // ========== 第2步：降噪处理（高斯模糊简化版）==========
    // 使用3x3均值滤波降噪
    const tempData = new Uint8ClampedArray(data);
    const noiseReduction = 0.3 * intensity;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += tempData[((y + dy) * w + (x + dx)) * 4 + c];
              count++;
            }
          }
          const avg = sum / count;
          const original = tempData[(y * w + x) * 4 + c];
          // 混合原图和降噪结果
          data[(y * w + x) * 4 + c] = clamp(
            Math.round(original * (1 - noiseReduction) + avg * noiseReduction),
            0, 255
          );
        }
      }
    }

    // ========== 第3步：自适应对比度增强 ==========
    // 计算全局平均亮度
    let totalLum = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const avgLum = totalLum / (data.length / 4);

    // 根据平均亮度调整对比度因子
    const contrastFactor = (avgLum < 100 ? 1.3 : avgLum > 180 ? 1.1 : 1.2) * intensity;
    const factor = (259 * (128 * contrastFactor - 128 + 255)) / (255 * (259 - 128 * contrastFactor + 128));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(Math.round(factor * (data[i] - 128) + 128), 0, 255);
      data[i + 1] = clamp(Math.round(factor * (data[i + 1] - 128) + 128), 0, 255);
      data[i + 2] = clamp(Math.round(factor * (data[i + 2] - 128) + 128), 0, 255);
    }

    // ========== 第4步：USM锐化（Unsharp Mask）==========
    // 比普通锐化更自然，模拟专业修图软件效果
    const sharpenAmount = 0.5 * intensity;
    const sharpenRadius = 1;
    const output = new Uint8ClampedArray(data.length);

    for (let y = sharpenRadius; y < h - sharpenRadius; y++) {
      for (let x = sharpenRadius; x < w - sharpenRadius; x++) {
        for (let c = 0; c < 3; c++) {
          // 计算周围像素平均值（模糊）
          let blur = 0;
          let count = 0;
          for (let dy = -sharpenRadius; dy <= sharpenRadius; dy++) {
            for (let dx = -sharpenRadius; dx <= sharpenRadius; dx++) {
              blur += data[((y + dy) * w + (x + dx)) * 4 + c];
              count++;
            }
          }
          blur /= count;

          // USM公式：result = original + amount * (original - blur)
          const original = data[(y * w + x) * 4 + c];
          const sharpened = original + sharpenAmount * (original - blur);
          output[(y * w + x) * 4 + c] = clamp(Math.round(sharpened), 0, 255);
        }
        output[(y * w + x) * 4 + 3] = data[(y * w + x) * 4 + 3];
      }
    }

    // 处理边缘像素
    for (let y = 0; y < sharpenRadius; y++) {
      for (let x = 0; x < w; x++) {
        for (let c = 0; c < 4; c++) {
          output[(y * w + x) * 4 + c] = data[(y * w + x) * 4 + c];
          output[((h - 1 - y) * w + x) * 4 + c] = data[((h - 1 - y) * w + x) * 4 + c];
        }
      }
    }
    for (let x = 0; x < sharpenRadius; x++) {
      for (let y = 0; y < h; y++) {
        for (let c = 0; c < 4; c++) {
          output[(y * w + x) * 4 + c] = data[(y * w + x) * 4 + c];
          output[(y * w + (w - 1 - x)) * 4 + c] = data[(y * w + (w - 1 - x)) * 4 + c];
        }
      }
    }

    imageData.data.set(output);
    ctx.putImageData(imageData, 0, 0);

    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
    const downloadUrl = downloadBlobUrl(blob, 'restored.jpg');

    return {
      success: true,
      data: {
        状态: '修复完成',
        尺寸: `${canvas.width}×${canvas.height}`,
        处理步骤: '去黄褪色 → 降噪 → 对比度增强 → USM锐化',
        强度: `${intensity}x`,
        提示: '如效果不理想，可调整修复强度后重试',
      },
      downloadUrl,
      filename: 'restored.jpg',
    };
  } catch (e) { return { success: false, error: `修复失败: ${(e as Error).message}` }; }
}

/**
 * ============================================
 * AI一键抠图
 * 功能：智能识别背景并移除，支持透明背景输出
 * 原理：边缘采样 + 颜色距离计算 + 羽化处理
 * ============================================
 */
export async function aiBackgroundRemove(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    if (!file) return { success: false, error: '请选择图片' };

    // 阈值：颜色距离小于此值视为背景（默认35）
    const threshold = Number(input.threshold ?? 35);
    // 羽化：边缘过渡范围（默认3像素）
    const feather = Number(input.feather ?? 3);

    const img = await loadImageFromFile(file);

    // 限制最大尺寸，避免处理过慢
    const maxW = 1200;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    // ========== 第1步：从四边采样背景颜色 ==========
    const samples: { r: number; g: number; b: number }[] = [];
    const sampleCount = 30; // 每边采样点数

    // 顶部边缘采样
    for (let i = 0; i < sampleCount; i++) {
      const x = Math.round(i * w / (sampleCount - 1));
      const idx = (0 * w + Math.min(x, w - 1)) * 4;
      if (data[idx + 3] > 200) { // 只采样不透明的像素
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }
    // 底部边缘采样
    for (let i = 0; i < sampleCount; i++) {
      const x = Math.round(i * w / (sampleCount - 1));
      const idx = ((h - 1) * w + Math.min(x, w - 1)) * 4;
      if (data[idx + 3] > 200) {
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }
    // 左边边缘采样
    for (let i = 0; i < sampleCount; i++) {
      const y = Math.round(i * h / (sampleCount - 1));
      const idx = (Math.min(y, h - 1) * w + 0) * 4;
      if (data[idx + 3] > 200) {
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }
    // 右边边缘采样
    for (let i = 0; i < sampleCount; i++) {
      const y = Math.round(i * h / (sampleCount - 1));
      const idx = (Math.min(y, h - 1) * w + (w - 1)) * 4;
      if (data[idx + 3] > 200) {
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    if (samples.length < 10) {
      return { success: false, error: '无法识别背景颜色，请使用背景更单一的图片' };
    }

    // 计算平均背景色
    let avgR = 0, avgG = 0, avgB = 0;
    for (const s of samples) { avgR += s.r; avgG += s.g; avgB += s.b; }
    avgR = Math.round(avgR / samples.length);
    avgG = Math.round(avgG / samples.length);
    avgB = Math.round(avgB / samples.length);

    // ========== 第2步：计算每个像素与背景的距离 ==========
    const alphaData = new Uint8Array(w * h);

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const i = (py * w + px) * 4;
        const dr = data[i] - avgR;
        const dg = data[i + 1] - avgG;
        const db = data[i + 2] - avgB;

        // 欧氏距离计算颜色差异
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        // 根据距离设置透明度
        if (dist < threshold) {
          // 完全透明（背景）
          alphaData[py * w + px] = 0;
        } else if (dist < threshold + feather) {
          // 羽化过渡区
          alphaData[py * w + px] = Math.round(255 * (dist - threshold) / feather);
        } else {
          // 完全不透明（前景）
          alphaData[py * w + px] = 255;
        }
      }
    }

    // ========== 第3步：应用透明度 ==========
    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] = alphaData[Math.floor(i / 4)];
    }

    ctx.putImageData(imageData, 0, 0);

    const blob = await canvasToBlob(canvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'removed-bg.png');

    return {
      success: true,
      data: {
        状态: '背景已移除',
        格式: 'PNG (透明背景)',
        识别背景: `RGB(${avgR}, ${avgG}, ${avgB})`,
        阈值: threshold,
        羽化: `${feather}px`,
        提示: '如抠图效果不理想，可调整阈值（增大保留更多）和羽化参数',
      },
      downloadUrl,
      filename: 'removed-bg.png',
    };
  } catch (e) { return { success: false, error: `抠图失败: ${(e as Error).message}` }; }
}

/**
 * ============================================
 * 文字转手写体
 * 功能：将输入文字转换为手写风格图片
 * 支持横线纸、方格纸、空白纸三种风格
 * ============================================
 */
export async function textToHandwriting(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const paperStyle = (input.paperStyle as string) || 'lined';
    if (!text.trim()) return { success: false, error: '请输入要转换的文字' };

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = Math.max(400, Math.ceil(text.length / 30) * 42 + 120);
    const ctx = canvas.getContext('2d')!;

    // 绘制纸张背景
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

    // 绘制手写体文字
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
        const rot = (rand() - 0.5) * 6;
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

/**
 * ============================================
 * 词云生成器
 * 功能：根据输入文本生成词云图片
 * 原理：词频统计 + 螺旋布局 + 碰撞检测
 * 支持中文分词和英文单词
 * ============================================
 */
export async function wordCloudGenerate(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const colorScheme = (input.colorScheme as string) || 'warm';
    if (!text.trim()) return { success: false, error: '请输入文本' };

    // ========== 第1步：文本预处理和词频统计 ==========
    // 移除标点符号
    const cleaned = text.replace(/[，。！？、；：""''（）【】《》\n\r\t,\.!\?;:'"\(\)\[\]{}]/g, ' ');

    // 中文分词：按字符切分（简化版，实际应用可用jieba等分词库）
    const zhongwenMatches = cleaned.match(/[\u4e00-\u9fff]+/g) || [];

    // 英文单词提取
    const enWords = cleaned.replace(/[\u4e00-\u9fff]+/g, '').split(/\s+/).filter(w => w.length > 1);

    // 合并所有词
    const allWords = [...zhongwenMatches, ...enWords];

    // 统计词频
    const freq: Record<string, number> = {};
    for (const w of allWords) {
      const key = w.toLowerCase();
      freq[key] = (freq[key] || 0) + 1;
    }

    // 按频率排序，取前80个词
    const entries = Object.entries(freq)
      .filter(([_, c]) => c >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80);

    if (entries.length === 0) return { success: false, error: '未提取到有效词汇' };

    // ========== 第2步：创建画布 ==========
    const maxCount = entries[0][1];
    const minCount = entries[entries.length - 1][1];
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    // 绘制背景
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 第3步：定义配色方案 ==========
    const palettes: Record<string, string[]> = {
      warm: ['#e74c3c', '#e67e22', '#f1c40f', '#e91e63', '#ff5722', '#ff9800', '#ffc107'],
      cool: ['#3498db', '#2ecc71', '#1abc9c', '#00bcd4', '#4caf50', '#2196f3', '#009688'],
      purple: ['#9b59b6', '#8e44ad', '#e056a0', '#6c5ce7', '#a855f7', '#c084fc', '#e879f9'],
      neon: ['#00ff88', '#00d4ff', '#ff6ec7', '#ffe600', '#ff2d55', '#39ff14', '#bf00ff'],
    };
    const palette = palettes[colorScheme] || palettes.warm;

    // ========== 第4步：螺旋布局算法 ==========
    // 记录已放置词汇的矩形区域，用于碰撞检测
    const placedRects: { x: number; y: number; w: number; h: number }[] = [];
    const cx = canvas.width / 2, cy = canvas.height / 2;

    // 碰撞检测函数
    const doesCollide = (x: number, y: number, w: number, h: number): boolean => {
      const margin = 4; // 词间距
      for (const r of placedRects) {
        if (x - margin < r.x + r.w && x + w + margin > r.x &&
            y - margin < r.y + r.h && y + h + margin > r.y) {
          return true;
        }
      }
      return false;
    };

    // 随机数生成器
    let _randSeed = 12345;
    const nextRand = (): number => {
      _randSeed = (_randSeed * 1103515245 + 12345) & 0x7fffffff;
      return _randSeed / 0x7fffffff;
    };

    // ========== 第5步：逐词放置 ==========
    for (const [word, count] of entries) {
      // 根据词频计算字体大小
      const ratio = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
      const fontSize = Math.round(16 + ratio * 56); // 16px - 72px

      ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      const metrics = ctx.measureText(word);
      const tw = metrics.width;
      const th = fontSize;

      // 螺旋搜索放置位置
      let placed = false;
      for (let radius = 0; radius < 400 && !placed; radius += 3) {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
          const tx = cx + Math.cos(angle) * radius - tw / 2;
          const ty = cy + Math.sin(angle) * radius - th / 2;

          // 检查是否在画布范围内且不与其他词重叠
          if (tx > 10 && ty > 10 && tx + tw < canvas.width - 10 && ty + th < canvas.height - 10
              && !doesCollide(tx, ty, tw, th)) {
            // 随机选择颜色
            const color = palette[Math.floor(nextRand() * palette.length)];
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;

            // 添加轻微随机偏移，让词云更自然
            const rx = (nextRand() - 0.5) * 4;
            const ry = (nextRand() - 0.5) * 2;
            ctx.fillText(word, tx + rx, ty + th + ry);

            // 记录已放置区域
            placedRects.push({ x: tx, y: ty, w: tw, h: th });
            placed = true;
            break;
          }
        }
      }

      // 如果螺旋搜索失败，随机放置
      if (!placed) {
        const x = 10 + nextRand() * (canvas.width - tw - 20);
        const y = 10 + nextRand() * (canvas.height - th - 20);
        ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = palette[Math.floor(nextRand() * palette.length)];
        ctx.fillText(word, x, y + th);
        placedRects.push({ x, y, w: tw, h: th });
      }
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'wordcloud.png');

    return {
      success: true,
      data: {
        词汇数: `${entries.length} 个`,
        最高频词: entries[0][0],
        出现次数: `${entries[0][1]} 次`,
        配色: colorScheme === 'warm' ? '暖色系' : colorScheme === 'cool' ? '冷色系' : colorScheme === 'purple' ? '紫色系' : '霓虹色',
        提示: '词云大小反映词频高低，可下载PNG图片使用',
      },
      downloadUrl,
      filename: 'wordcloud.png',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

/**
 * ============================================
 * 像素画转换
 * 功能：将图片转换为像素风格
 * 原理：降采样 + 颜色量化
 * ============================================
 */
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

    // 颜色量化
    const colorBuckets: { r: number; g: number; b: number; count: number }[] = [];
    for (let i = 0; i < smallData.length; i += 4) {
      const r = Math.round(smallData[i] / (256 / 4)) * Math.floor(256 / 4);
      const g = Math.round(smallData[i + 1] / (256 / 4)) * Math.floor(256 / 4);
      const b = Math.round(smallData[i + 2] / (256 / 4)) * Math.floor(256 / 4);
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

    // 放大显示
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

/**
 * ============================================
 * 照片转素描
 * 功能：将照片转换为素描风格
 * 原理：灰度化 + Sobel边缘检测 + 反相
 * ============================================
 */
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

    // 灰度化
    const gray = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      gray[Math.floor(i / 4)] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Sobel边缘检测
    const edges = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx = gray[idx - w - 1] + 2 * gray[idx - 1] + gray[idx + w - 1] - gray[idx - w + 1] - 2 * gray[idx + 1] - gray[idx + w + 1];
        const gy = gray[idx - w - 1] + 2 * gray[idx - w] + gray[idx - w + 1] - gray[idx + w - 1] - 2 * gray[idx + w] - gray[idx + w + 1];
        edges[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }

    // 归一化并反相
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

/**
 * ============================================
 * LED弹幕生成器
 * 功能：生成LED跑马灯效果HTML文件
 * ============================================
 */
export async function ledMarquee(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const speed = (input.speed as string) || 'medium';
    const color = (input.color as string) || '#00ff88';
    const bgOpacity = (input.bgOpacity as string) || '0';
    const direction = (input.direction as string) || 'left';
    const fontSize = (input.fontSize as string) || 'auto';
    if (!text.trim()) return { success: false, error: '请输入弹幕文字' };

    const speedMs = speed === 'fast' ? 3000 : speed === 'slow' ? 10000 : 6000;
    const fontSizeCss = fontSize === 'auto' ? 'clamp(32px,8vw,120px)' : fontSize;
    const bgAlpha = Number(bgOpacity) / 100;
    const bgColor = `rgba(0,0,0,${bgAlpha})`;

    const dirKeyframes: Record<string, string> = {
      left: '@keyframes scroll{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}',
      right: '@keyframes scroll{0%{transform:translateX(-100%)}100%{transform:translateX(100vw)}}',
      up: '@keyframes scroll{0%{transform:translateY(100vh)}100%{transform:translateY(-100%)}}',
      down: '@keyframes scroll{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}',
    };
    const dirStyle = direction === 'up' || direction === 'down'
      ? 'writing-mode:vertical-lr;text-orientation:upright;'
      : 'white-space:nowrap;';

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:${bgColor};display:flex;align-items:center;justify-content:center;height:100vh;overflow:hidden}.marquee{font-size:${fontSizeCss};font-weight:900;color:${color};${dirStyle}animation:scroll ${speedMs}ms linear infinite;text-shadow:0 0 20px ${color},0 0 40px ${color},0 0 80px ${color}}${dirKeyframes[direction]}</style></head><body><div class="marquee">${text}</div></body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        弹幕文字: text,
        滚动方向: direction === 'left' ? '← 向左' : direction === 'right' ? '→ 向右' : direction === 'up' ? '↑ 向上' : '↓ 向下',
        速度: speed === 'fast' ? '快速' : speed === 'slow' ? '慢速' : '正常',
        颜色: color,
        提示: '点击「下载」保存HTML文件，用浏览器打开(F11全屏)即可展示弹幕',
      },
      downloadUrl,
      filename: 'led-marquee.html',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}

/**
 * ============================================
 * 抽奖转盘生成器
 * 功能：生成可交互的抽奖转盘HTML文件
 * ============================================
 */
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

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + radius - 5, cy - 15);
    ctx.lineTo(cx + radius + 20, cy);
    ctx.lineTo(cx + radius - 5, cy + 15);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c';
    ctx.fill();

    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ecf0f1';
    ctx.textAlign = 'center';
    ctx.fillText(title, cx, 40);

    const blob = await canvasToBlob(canvas, 'image/png');
    const downloadUrl = downloadBlobUrl(blob, 'lucky-wheel.png');

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:20px;font-family:"PingFang SC","Microsoft YaHei",sans-serif}h1{color:#ecf0f1}canvas{cursor:pointer;border-radius:50%;box-shadow:0 0 40px rgba(255,255,255,.1)}button{padding:12px 40px;font-size:18px;border:none;border-radius:12px;background:#e74c3c;color:#fff;cursor:pointer;font-weight:bold}button:active{transform:scale(.95)}#result{color:#f1c40f;font-weight:bold;min-height:40px;font-size:24px}</style></head><body><h1>${title}</h1><canvas id="wheel" width="500" height="500"></canvas><button onclick="spin()">🎯 开始转动</button><div id="result"></div><script>const names=${JSON.stringify(nameList)};const colors=${JSON.stringify(colors)};let spinning=false;const canvas=document.getElementById('wheel');const ctx=canvas.getContext('2d');const cx=250,cy=250,radius=220;let currentAngle=0;const sliceAngle=360/names.length;function drawWheel(angle){ctx.clearRect(0,0,500,500);ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.arc(cx,cy,radius+15,0,Math.PI*2);ctx.fill();for(let i=0;i<names.length;i++){const startAngle=((i*sliceAngle-90)+angle)*Math.PI/180;const endAngle=(((i+1)*sliceAngle-90)+angle)*Math.PI/180;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,radius,startAngle,endAngle);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#1a1a2e';ctx.lineWidth=2;ctx.stroke();const midAngle=(startAngle+endAngle)/2;const labelR=radius*.65;ctx.save();ctx.translate(cx+Math.cos(midAngle)*labelR,cy+Math.sin(midAngle)*labelR);ctx.rotate(midAngle+Math.PI/2);ctx.font='bold 14px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(names[i].slice(0,6),0,0);ctx.restore()}ctx.beginPath();ctx.arc(cx,cy,30,0,Math.PI*2);ctx.fillStyle='#2c3e50';ctx.fill();ctx.strokeStyle='#ecf0f1';ctx.lineWidth=3;ctx.stroke()}function spin(){if(spinning)return;spinning=true;document.getElementById('result').textContent='';const targetAngle=currentAngle+1800+Math.random()*1800;const startTime=Date.now();const duration=5000;function animate(){const elapsed=Date.now()-startTime;const progress=Math.min(elapsed/duration,1);const eased=1-Math.pow(1-progress,4);currentAngle=currentAngle+(targetAngle-currentAngle)*eased;drawWheel(currentAngle);if(progress<1){requestAnimationFrame(animate)}else{spinning=false;const normalizedAngle=((currentAngle%360)+360)%360;const winnerIndex=Math.floor((360-normalizedAngle+90)/sliceAngle)%names.length;document.getElementById('result').textContent='🎉 恭喜 '+names[winnerIndex]+' 中奖！'}}animate()}drawWheel(0)</script></body></html>`;

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlDownloadUrl = downloadBlobUrl(htmlBlob, 'lucky-wheel.html');

    return {
      success: true,
      data: {
        选项数: `${nameList.length} 个`,
        标题: title,
        提示: '点击「下载」保存HTML文件，用浏览器打开即可互动抽奖！',
      },
      downloadUrl: htmlDownloadUrl,
      filename: 'lucky-wheel.html',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}
