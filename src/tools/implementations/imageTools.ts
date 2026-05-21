import Tesseract from 'tesseract.js';
import type { ToolOutput } from '@/types';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('图片加载失败')); };
    img.src = URL.createObjectURL(file);
  });
}

export async function imageCompress(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const quality = Number(input.quality ?? 0.7);
    const format = (input.format as string) || 'image/jpeg';

    if (!file) return { success: false, error: '请选择图片文件' };

    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('压缩失败'))),
        format,
        Math.max(0.1, Math.min(1, quality))
      );
    });

    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const downloadUrl = URL.createObjectURL(blob);
    const originalSize = (file.size / 1024).toFixed(1);
    const compressedSize = (blob.size / 1024).toFixed(1);
    const ratio = ((1 - blob.size / file.size) * 100).toFixed(1);

    return {
      success: true,
      data: {
        原始大小: `${originalSize} KB`,
        压缩后大小: `${compressedSize} KB`,
        压缩率: `${ratio}%`,
        图片尺寸: `${img.naturalWidth} x ${img.naturalHeight}`,
      },
      downloadUrl,
      filename: `compressed.${ext}`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function imageConvert(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const targetFormat = (input.targetFormat as string) || 'image/webp';

    if (!file) return { success: false, error: '请选择图片文件' };

    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('转换失败'))),
        targetFormat,
        0.92
      );
    });

    const ext = targetFormat === 'image/png' ? 'png' : targetFormat === 'image/webp' ? 'webp' : 'jpg';
    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        原始格式: file.type,
        目标格式: targetFormat,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
        图片尺寸: `${img.naturalWidth} x ${img.naturalHeight}`,
      },
      downloadUrl,
      filename: `converted.${ext}`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function imageResize(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    let width = Number(input.width);
    let height = Number(input.height);
    const keepRatio = input.keepRatio !== false;

    if (!file) return { success: false, error: '请选择图片文件' };
    if (!width && !height) return { success: false, error: '请输入目标宽度或高度' };

    const img = await loadImage(file);
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;

    if (keepRatio) {
      if (width && !height) {
        height = Math.round((width / originalWidth) * originalHeight);
      } else if (height && !width) {
        width = Math.round((height / originalHeight) * originalWidth);
      } else {
        const ratio = Math.min(width / originalWidth, height / originalHeight);
        width = Math.round(originalWidth * ratio);
        height = Math.round(originalHeight * ratio);
      }
    }

    width = width || originalWidth;
    height = height || originalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('缩放失败'))),
        'image/png'
      );
    });

    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        原始尺寸: `${originalWidth} x ${originalHeight}`,
        新尺寸: `${width} x ${height}`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: 'resized.png',
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function idPhoto(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const bgColor = (input.bgColor as string) || 'blue';
    const size = (input.size as string) || '1inch';

    if (!file) return { success: false, error: '请选择图片文件' };

    const img = await loadImage(file);

    const sizeMap: Record<string, [number, number]> = {
      '1inch': [295, 413],
      '2inch': [413, 579],
      'small1inch': [260, 378],
    };
    const [targetW, targetH] = sizeMap[size] || sizeMap['1inch'];
    const targetRatio = targetW / targetH;

    const colorMap: Record<string, string> = {
      blue: '#438EDB',
      red: '#FF0000',
      white: '#FFFFFF',
    };
    const bgHex = colorMap[bgColor] || colorMap.blue;

    let cropW = img.naturalWidth;
    let cropH = img.naturalHeight;
    const currentRatio = cropW / cropH;

    if (currentRatio > targetRatio) {
      cropW = Math.round(cropH * targetRatio);
    } else {
      cropH = Math.round(cropW / targetRatio);
    }

    const cropX = Math.round((img.naturalWidth - cropW) / 2);
    const cropY = Math.round((img.naturalHeight - cropH) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, targetW, targetH);

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

    const imageData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imageData.data;

    const corners = [
      [0, 0], [targetW - 1, 0], [0, targetH - 1], [targetW - 1, targetH - 1]
    ];
    let avgRefR = 0, avgRefG = 0, avgRefB = 0;
    for (const [cx, cy] of corners) {
      const ci = (cy * targetW + cx) * 4;
      avgRefR += data[ci]; avgRefG += data[ci + 1]; avgRefB += data[ci + 2];
    }
    avgRefR = Math.round(avgRefR / 4);
    avgRefG = Math.round(avgRefG / 4);
    avgRefB = Math.round(avgRefB / 4);

    const bgR = parseInt(bgHex.slice(1, 3), 16);
    const bgG = parseInt(bgHex.slice(3, 5), 16);
    const bgB = parseInt(bgHex.slice(5, 7), 16);

    const colorThreshold = 35;

    for (let i = 0; i < data.length; i += 4) {
      const dr = Math.abs(data[i] - avgRefR);
      const dg = Math.abs(data[i + 1] - avgRefG);
      const db = Math.abs(data[i + 2] - avgRefB);
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < colorThreshold) {
        const blend = Math.min(1, dist / colorThreshold);
        data[i] = Math.round(data[i] * blend + bgR * (1 - blend));
        data[i + 1] = Math.round(data[i + 1] * blend + bgG * (1 - blend));
        data[i + 2] = Math.round(data[i + 2] * blend + bgB * (1 - blend));
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('证件照生成失败'))),
        'image/jpeg',
        0.95
      );
    });

    const downloadUrl = URL.createObjectURL(blob);
    const sizeLabel = size === '1inch' ? '1寸' : size === '2inch' ? '2寸' : '小1寸';

    return {
      success: true,
      data: {
        尺寸: sizeLabel,
        背景色: bgColor === 'blue' ? '蓝色' : bgColor === 'red' ? '红色' : '白色',
        像素尺寸: `${targetW} x ${targetH} px`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: `id-photo-${size}.jpg`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function imageWatermark(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const text = input.text as string;
    const position = (input.position as string) || 'bottom-right';
    const opacity = Number(input.opacity ?? 0.3);
    const color = (input.color as string) || '#ffffff';

    if (!file) return { success: false, error: '请选择图片文件' };
    if (!text) return { success: false, error: '请输入水印文字' };

    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(16, Math.round(img.naturalWidth * 0.03));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0.05, Math.min(1, opacity));

    const margin = fontSize;

    if (position === 'tile') {
      const metrics = ctx.measureText(text);
      const textW = metrics.width + fontSize * 2;
      const textH = fontSize * 3;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      for (let y = -canvas.height; y < canvas.height; y += textH) {
        for (let x = -canvas.width; x < canvas.width; x += textW) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
    } else {
      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      let x: number, y: number;

      switch (position) {
        case 'top-left':
          x = margin;
          y = margin + fontSize;
          break;
        case 'top-right':
          x = canvas.width - textW - margin;
          y = margin + fontSize;
          break;
        case 'center':
          x = (canvas.width - textW) / 2;
          y = canvas.height / 2 + fontSize / 3;
          break;
        case 'bottom-left':
          x = margin;
          y = canvas.height - margin;
          break;
        case 'bottom-right':
        default:
          x = canvas.width - textW - margin;
          y = canvas.height - margin;
          break;
      }
      ctx.fillText(text, x, y);
    }

    ctx.globalAlpha = 1;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('水印添加失败'))),
        'image/png'
      );
    });

    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        水印文字: text,
        位置: position === 'tile' ? '平铺' : position,
        透明度: opacity,
        颜色: color,
        图片尺寸: `${img.naturalWidth} x ${img.naturalHeight}`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: 'watermarked.png',
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function imageWatermarkRemove(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const mode = (input.mode as string) || 'auto-light';
    const strength = Math.max(1, Math.min(10, Number(input.strength ?? 5)));

    if (!file) return { success: false, error: '请选择图片文件' };

    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;
    const totalPixels = w * h;

    const brightnessArr = new Float32Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      brightnessArr[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
    }

    const radius = Math.max(3, Math.round(Math.min(w, h) * 0.005 * strength));

    if (mode === 'edge-clean') {
      const edgeSize = Math.round(Math.min(w, h) * 0.05 * (strength / 5));
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const inEdge = x < edgeSize || x >= w - edgeSize || y < edgeSize || y >= h - edgeSize;
          if (inEdge) {
            const idx = (y * w + x) * 4;
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const nIdx = (ny * w + nx) * 4;
                  sumR += data[nIdx];
                  sumG += data[nIdx + 1];
                  sumB += data[nIdx + 2];
                  count++;
                }
              }
            }
            data[idx] = Math.round(sumR / count);
            data[idx + 1] = Math.round(sumG / count);
            data[idx + 2] = Math.round(sumB / count);
          }
        }
      }
    } else {
      const isLight = mode === 'auto-light';

      const localAvg = new Float32Array(totalPixels);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0, count = 0;
          const r = radius;
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                sum += brightnessArr[ny * w + nx];
                count++;
              }
            }
          }
          localAvg[y * w + x] = sum / count;
        }
      }

      const threshold = (11 - strength) * 8;

      const mask = new Uint8Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const diff = brightnessArr[i] - localAvg[i];
        if (isLight && diff > threshold) mask[i] = 1;
        if (!isLight && diff < -threshold) mask[i] = 1;
      }

      for (let iter = 0; iter < 2; iter++) {
        const newMask = new Uint8Array(mask);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            if (mask[i]) continue;
            let neighbors = 0;
            let watermarkNeighbors = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                neighbors++;
                if (mask[(y + dy) * w + (x + dx)]) watermarkNeighbors++;
              }
            }
            if (watermarkNeighbors > neighbors * 0.5) newMask[i] = 1;
          }
        }
        mask.set(newMask);
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!mask[i]) continue;
          const idx = i * 4;

          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          const searchR = Math.max(radius, 5);
          for (let dy = -searchR; dy <= searchR; dy += 2) {
            for (let dx = -searchR; dx <= searchR; dx += 2) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h && !mask[ny * w + nx]) {
                const nIdx = (ny * w + nx) * 4;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const weight = 1 / (1 + dist);
                sumR += data[nIdx] * weight;
                sumG += data[nIdx + 1] * weight;
                sumB += data[nIdx + 2] * weight;
                count += weight;
              }
            }
          }

          if (count > 0) {
            data[idx] = Math.round(sumR / count);
            data[idx + 1] = Math.round(sumG / count);
            data[idx + 2] = Math.round(sumB / count);
          }
        }
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!mask[i]) continue;
          const idx = i * 4;
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = (ny * w + nx) * 4;
                sumR += data[nIdx];
                sumG += data[nIdx + 1];
                sumB += data[nIdx + 2];
                count++;
              }
            }
          }
          data[idx] = Math.round(sumR / count);
          data[idx + 1] = Math.round(sumG / count);
          data[idx + 2] = Math.round(sumB / count);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('去水印处理失败'))),
        'image/png'
      );
    });

    const downloadUrl = URL.createObjectURL(blob);
    const modeLabel = mode === 'auto-light' ? '自动检测(浅色水印)' : mode === 'auto-dark' ? '自动检测(深色水印)' : '边缘区域清除';

    return {
      success: true,
      data: {
        处理模式: modeLabel,
        强度: strength,
        图片尺寸: `${img.naturalWidth} x ${img.naturalHeight}`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: 'watermark-removed.png',
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function imageStitch(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const files = input.files as File | File[];
    const direction = (input.direction as string) || 'vertical';
    const gap = Number(input.gap ?? 0);

    if (!files) return { success: false, error: '请选择图片文件' };

    const fileArray = Array.isArray(files) ? files : [files];
    if (fileArray.length === 0) return { success: false, error: '请选择至少一张图片' };

    const images = await Promise.all(fileArray.map(file => loadImage(file)));

    if (images.length === 1) {
      const canvas = document.createElement('canvas');
      canvas.width = images[0].naturalWidth;
      canvas.height = images[0].naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(images[0], 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('处理失败'))),
          'image/png'
        );
      });
      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        data: {
          拼接方向: direction === 'vertical' ? '纵向' : '横向',
          图片数量: 1,
          图片尺寸: `${canvas.width} x ${canvas.height}`,
          文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
          提示: '仅选择了一张图片，请按住Ctrl/Cmd多选图片以实现拼接',
        },
        downloadUrl,
        filename: 'stitched.png',
      };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (direction === 'vertical') {
      const maxWidth = Math.max(...images.map(img => img.naturalWidth));
      const totalHeight = images.reduce((sum, img) => {
        const scale = maxWidth / img.naturalWidth;
        return sum + Math.round(img.naturalHeight * scale);
      }, 0) + gap * (images.length - 1);

      canvas.width = maxWidth;
      canvas.height = totalHeight;

      let y = 0;
      for (const img of images) {
        const scale = maxWidth / img.naturalWidth;
        const drawHeight = Math.round(img.naturalHeight * scale);
        ctx.drawImage(img, 0, y, maxWidth, drawHeight);
        y += drawHeight + gap;
      }
    } else {
      const maxHeight = Math.max(...images.map(img => img.naturalHeight));
      const totalWidth = images.reduce((sum, img) => {
        const scale = maxHeight / img.naturalHeight;
        return sum + Math.round(img.naturalWidth * scale);
      }, 0) + gap * (images.length - 1);

      canvas.width = totalWidth;
      canvas.height = maxHeight;

      let x = 0;
      for (const img of images) {
        const scale = maxHeight / img.naturalHeight;
        const drawWidth = Math.round(img.naturalWidth * scale);
        ctx.drawImage(img, x, 0, drawWidth, maxHeight);
        x += drawWidth + gap;
      }
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('拼接处理失败'))),
        'image/png'
      );
    });

    const downloadUrl = URL.createObjectURL(blob);
    const dirLabel = direction === 'vertical' ? '纵向' : '横向';

    return {
      success: true,
      data: {
        拼接方向: dirLabel,
        图片数量: images.length,
        图片尺寸: `${canvas.width} x ${canvas.height}`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: 'stitched.png',
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function imageOcr(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const lang = (input.lang as string) || 'chi_sim+eng';

    if (!file) return { success: false, error: '请选择图片文件' };

    const imageUrl = URL.createObjectURL(file);

    const langMap: Record<string, string> = {
      'chi_sim': 'chi_sim',
      'eng': 'eng',
      'chi_sim+eng': 'chi_sim+eng',
    };
    const tesseractLang = langMap[lang] || 'chi_sim+eng';

    const result = await Tesseract.recognize(imageUrl, tesseractLang, {
      logger: (info) => {
        if (info.status === 'recognizing text') {
          console.log(`OCR进度: ${Math.round((info.progress || 0) * 100)}%`);
        }
      },
    });

    URL.revokeObjectURL(imageUrl);

    if (!result.data || !result.data.text) {
      return { success: false, error: 'OCR识别失败，请确认图片中包含文字' };
    }

    const text = result.data.text.trim();
    if (!text) {
      return { success: true, data: '未识别到文字内容，请确认图片中包含清晰的文字' };
    }

    const confidence = result.data.confidence;
    const words = result.data.words;

    return {
      success: true,
      data: {
        识别结果: text,
        置信度: `${confidence.toFixed(1)}%`,
        识别词数: words?.length || 0,
        识别语言: lang === 'chi_sim' ? '中文' : lang === 'eng' ? '英文' : '中英混合',
        图片尺寸: `${(result.data as unknown as Record<string, unknown>).imageWidth || '?'} x ${(result.data as unknown as Record<string, unknown>).imageHeight || '?'}`,
        提示: '首次使用OCR需下载语言模型(约10MB)，请耐心等待',
      },
    };
  } catch (e) {
    return { success: false, error: `OCR识别失败: ${(e as Error).message}` };
  }
}

export async function imageToPdf(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const files = input.files as File | File[];
    const orientation = (input.orientation as string) || 'auto';
    const pageSize = (input.pageSize as string) || 'a4';

    if (!files) return { success: false, error: '请选择图片文件' };

    const fileArray = Array.isArray(files) ? files : [files];
    if (fileArray.length === 0) return { success: false, error: '请选择至少一张图片' };

    const pageSizes = {
      a4: { width: 595.28, height: 841.89 },
      letter: { width: 612, height: 792 },
    };

    const size = pageSizes[pageSize as keyof typeof pageSizes] || pageSizes.a4;

    const images: HTMLImageElement[] = [];
    for (const file of fileArray) {
      images.push(await loadImage(file));
    }

    const canvas = document.createElement('canvas');

    if (fileArray.length === 1) {
      const img = images[0];
      const isLandscape = img.naturalWidth > img.naturalHeight;
      const useLandscape = orientation === 'auto' ? isLandscape : orientation === 'landscape';

      if (useLandscape) {
        canvas.width = size.height;
        canvas.height = size.width;
      } else {
        canvas.width = size.width;
        canvas.height = size.height;
      }

      const ctx = canvas.getContext('2d')!;
      if (img.naturalWidth === 0 || img.naturalHeight === 0) return { success: false, error: '图片加载失败，请检查文件格式' };
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const margin = 20;
      const maxW = canvas.width - margin * 2;
      const maxH = canvas.height - margin * 2;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const x = (canvas.width - drawW) / 2;
      const y = (canvas.height - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
    } else {
      const maxW = Math.max(...images.map(img => img.naturalWidth));
      const totalH = images.reduce((sum, img) => {
        const scale = maxW / img.naturalWidth;
        return sum + img.naturalHeight * scale;
      }, 0);

      canvas.width = maxW;
      canvas.height = totalH;

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let y = 0;
      for (const img of images) {
        const scale = maxW / img.naturalWidth;
        const drawH = img.naturalHeight * scale;
        ctx.drawImage(img, 0, y, maxW, drawH);
        y += drawH;
      }
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('转换失败'))),
        'image/png'
      );
    });

    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        图片数量: fileArray.length,
        页面大小: pageSize.toUpperCase(),
        页面方向: orientation === 'landscape' ? '横向' : orientation === 'portrait' ? '纵向' : '自动',
        输出尺寸: `${canvas.width} x ${canvas.height} px`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
        提示: '已生成图片格式，如需真正的PDF请使用浏览器打印功能(Ctrl+P)另存为PDF',
      },
      downloadUrl,
      filename: 'images-to-pdf.png',
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function screenshotAnnotate(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const annotationType = (input.annotationType as string) || 'arrow-red';
    const startX = Number(input.startX ?? 20) / 100;
    const startY = Number(input.startY ?? 30) / 100;
    const endX = Number(input.endX ?? 70) / 100;
    const endY = Number(input.endY ?? 60) / 100;
    const text = (input.text as string) || '';

    if (!file) return { success: false, error: '请选择图片文件' };

    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const sx = startX * canvas.width;
    const sy = startY * canvas.height;
    const ex = endX * canvas.width;
    const ey = endY * canvas.height;

    const isRed = annotationType.includes('red');
    const color = isRed ? '#FF0000' : '#00CC00';
    const lineWidth = Math.max(3, Math.round(Math.min(canvas.width, canvas.height) * 0.005));

    if (annotationType.startsWith('arrow')) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      const angle = Math.atan2(ey - sy, ex - sx);
      const headLen = lineWidth * 8;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (annotationType.startsWith('rect')) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(sx, sy, ex - sx, ey - sy);
    } else if (annotationType === 'text' && text) {
      const fontSize = Math.max(16, Math.round(Math.min(canvas.width, canvas.height) * 0.03));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;

      const padding = fontSize * 0.3;
      const metrics = ctx.measureText(text);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(ex - padding, ey - fontSize - padding, metrics.width + padding * 2, fontSize + padding * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, ex, ey);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('标注失败'))),
        'image/png'
      );
    });

    const downloadUrl = URL.createObjectURL(blob);
    const typeLabel = annotationType.startsWith('arrow') ? '箭头' : annotationType.startsWith('rect') ? '框选' : '文字';

    return {
      success: true,
      data: {
        标注类型: typeLabel,
        标注颜色: isRed ? '红色' : '绿色',
        图片尺寸: `${canvas.width} x ${canvas.height}`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: 'annotated.png',
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function imageCrop(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.image as File;
    const cropWidth = Number(input.width) || 800;
    const cropHeight = Number(input.height) || 600;
    const startX = Number(input.x) || 0;
    const startY = Number(input.y) || 0;

    if (!file) return { success: false, error: '请上传图片' };

    const img = new Image();
    const url = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = url;
    });

    const actualWidth = Math.min(cropWidth, img.width - startX);
    const actualHeight = Math.min(cropHeight, img.height - startY);

    if (actualWidth <= 0 || actualHeight <= 0) {
      URL.revokeObjectURL(url);
      return { success: false, error: '裁剪区域超出图片范围' };
    }

    const canvas = document.createElement('canvas');
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, startX, startY, actualWidth, actualHeight, 0, 0, actualWidth, actualHeight);

    URL.revokeObjectURL(url);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('裁剪失败'))),
        file.type || 'image/png',
        0.92
      );
    });

    const downloadUrl = URL.createObjectURL(blob);
    return {
      success: true,
      data: {
        原始尺寸: `${img.width} x ${img.height} px`,
        裁剪尺寸: `${actualWidth} x ${actualHeight} px`,
        裁剪位置: `(${startX}, ${startY})`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: `cropped-${file.name}`,
    };
  } catch (e) {
    return { success: false, error: `裁剪失败: ${(e as Error).message}` };
  }
}

export async function pdfMerge(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const rawFiles = input.files;
    let files: File[] = [];

    if (Array.isArray(rawFiles)) {
      files = rawFiles as File[];
    } else if (rawFiles instanceof File) {
      files = [rawFiles];
    }

    if (files.length < 2) return { success: false, error: '请至少上传2个PDF文件' };

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return { success: false, error: `${file.name} 不是PDF文件` };
      }
    }

    const pdfBytes: Uint8Array[] = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      pdfBytes.push(new Uint8Array(buffer));
    }

    const firstPdf = pdfBytes[0];
    const mergedChunks: Uint8Array[] = [firstPdf];

    for (let i = 1; i < pdfBytes.length; i++) {
      const pdf = pdfBytes[i];
      const eofMarker = new TextEncoder().encode('%%EOF');
      let lastEofPos = -1;
      for (let j = pdf.length - 10; j >= 0; j--) {
        let match = true;
        for (let k = 0; k < eofMarker.length; k++) {
          if (pdf[j + k] !== eofMarker[k]) { match = false; break; }
        }
        if (match) { lastEofPos = j; break; }
      }
      if (lastEofPos >= 0) {
        mergedChunks.push(pdf.slice(0, lastEofPos));
      } else {
        mergedChunks.push(pdf);
      }
    }

    const totalLength = mergedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of mergedChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const blob = new Blob([merged], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        合并文件数: `${files.length} 个`,
        文件列表: files.map(f => f.name).join('、'),
        合并后大小: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        提示: 'PDF合并为简单拼接方式，复杂PDF建议使用专业工具',
      },
      downloadUrl,
      filename: 'merged.pdf',
    };
  } catch (e) {
    return { success: false, error: `合并失败: ${(e as Error).message}` };
  }
}
