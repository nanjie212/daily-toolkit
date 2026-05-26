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
    const file = input.file as File;
    if (!file) return { success: false, error: '请上传图片' };

    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.readAsDataURL(file);
    });

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>图片裁剪</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#1a1a2e;color:#fff;min-height:100vh;display:flex;flex-direction:column}
.header{display:flex;align-items:center;padding:12px 16px;background:rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.08)}
.header h1{font-size:16px;font-weight:600}
.crop-container{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;position:relative;overflow:hidden}
.crop-wrapper{position:relative;display:inline-block;max-width:100%;max-height:calc(100vh - 200px)}
.crop-wrapper img{display:block;max-width:100%;max-height:calc(100vh - 200px);user-select:none;-webkit-user-drag:none}
.crop-overlay{position:absolute;top:0;left:0;width:100%;height:100%;cursor:crosshair}
.crop-box{position:absolute;border:2px dashed #fff;box-shadow:0 0 0 9999px rgba(0,0,0,0.5);cursor:move;display:none}
.crop-box.active{display:block}
.resize-handle{position:absolute;width:12px;height:12px;background:#007aff;border:2px solid #fff;border-radius:50%;z-index:10}
.resize-handle.tl{top:-6px;left:-6px;cursor:nw-resize}
.resize-handle.tr{top:-6px;right:-6px;cursor:ne-resize}
.resize-handle.bl{bottom:-6px;left:-6px;cursor:sw-resize}
.resize-handle.br{bottom:-6px;right:-6px;cursor:se-resize}
.crop-info{position:absolute;bottom:-28px;left:0;font-size:12px;color:#8e8e93;white-space:nowrap}
.toolbar{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px;background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.08)}
.aspect-group{display:flex;gap:4px}
.aspect-btn{padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#8e8e93;font-size:13px;cursor:pointer;transition:all .2s}
.aspect-btn.active{background:#007aff;color:#fff;border-color:#007aff}
.btn{padding:10px 24px;border-radius:10px;border:none;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.btn-crop{background:#007aff;color:#fff}
.btn-crop:hover{background:#0056cc}
.btn-reset{background:rgba(255,255,255,0.1);color:#8e8e93}
.btn-reset:hover{background:rgba(255,255,255,0.15);color:#fff}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.result-container{display:none;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:16px}
.result-container.active{display:flex}
.result-container img{max-width:100%;max-height:60vh;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.3)}
.result-info{text-align:center;font-size:13px;color:#8e8e93}
.btn-group{display:flex;gap:12px}
.btn-download{background:#34c759;color:#fff}
.btn-download:hover{background:#28a745}
.btn-back{background:rgba(255,255,255,0.1);color:#8e8e93}
.btn-back:hover{background:rgba(255,255,255,0.15);color:#fff}
</style>
</head>
<body>
<div class="header">
  <h1>🖼️ 图片裁剪</h1>
</div>

<div class="crop-container" id="cropContainer">
  <div class="crop-wrapper" id="cropWrapper">
    <img id="sourceImage" src="\${dataUrl}" alt="原图">
    <div class="crop-overlay" id="cropOverlay"></div>
    <div class="crop-box" id="cropBox">
      <div class="resize-handle tl" data-dir="tl"></div>
      <div class="resize-handle tr" data-dir="tr"></div>
      <div class="resize-handle bl" data-dir="bl"></div>
      <div class="resize-handle br" data-dir="br"></div>
      <div class="crop-info" id="cropInfo"></div>
    </div>
  </div>
</div>

<div class="result-container" id="resultContainer">
  <img id="resultImage" alt="裁剪结果">
  <div class="result-info" id="resultInfo"></div>
  <div class="btn-group">
    <button class="btn btn-back" onclick="backToCrop()">返回重新裁剪</button>
    <button class="btn btn-download" id="downloadBtn">下载裁剪图片</button>
  </div>
</div>

<div class="toolbar">
  <div class="aspect-group">
    <button class="aspect-btn active" data-ratio="free">自由</button>
    <button class="aspect-btn" data-ratio="1:1">1:1</button>
    <button class="aspect-btn" data-ratio="4:3">4:3</button>
    <button class="aspect-btn" data-ratio="16:9">16:9</button>
    <button class="aspect-btn" data-ratio="3:4">3:4</button>
    <button class="aspect-btn" data-ratio="9:16">9:16</button>
  </div>
  <button class="btn btn-reset" onclick="resetCrop()">重置</button>
  <button class="btn btn-crop" id="cropBtn" onclick="doCrop()">✂️ 裁剪</button>
</div>

<script>
const img = document.getElementById('sourceImage');
const overlay = document.getElementById('cropOverlay');
const cropBox = document.getElementById('cropBox');
const cropInfo = document.getElementById('cropInfo');
const cropBtn = document.getElementById('cropBtn');
const cropContainer = document.getElementById('cropContainer');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const resultInfo = document.getElementById('resultInfo');
const downloadBtn = document.getElementById('downloadBtn');

let isDragging = false;
let isResizing = false;
let isMoving = false;
let startX, startY, startW, startH;
let currentDir = '';
let aspectRatio = 0;
let cropRect = null;

img.onload = function() {
  const wrapper = document.getElementById('cropWrapper');
  const rect = wrapper.getBoundingClientRect();
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const displayW = img.width;
  const displayH = img.height;
  const scaleX = naturalW / displayW;
  const scaleY = naturalH / displayH;

  // 默认裁剪区域：居中 70%
  const defaultW = displayW * 0.7;
  const defaultH = displayH * 0.7;
  const defaultX = (displayW - defaultW) / 2;
  const defaultY = (displayH - defaultH) / 2;
  showCrop(defaultX, defaultY, defaultW, defaultH);
  updateCropInfo(defaultX, defaultY, defaultW, defaultH, scaleX, scaleY);

  overlay.onmousedown = function(e) {
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (mx >= cropRect.x && mx <= cropRect.x + cropRect.w && my >= cropRect.y && my <= cropRect.y + cropRect.h) {
      isMoving = true;
      startX = e.clientX;
      startY = e.clientY;
      return;
    }
    isDragging = true;
    cropRect = { x: mx, y: my, w: 0, h: 0 };
    cropBox.className = 'crop-box active';
    startX = mx;
    startY = my;
  };

  document.onmousemove = function(e) {
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDragging) {
      let nx = Math.min(startX, mx);
      let ny = Math.min(startY, my);
      let nw = Math.abs(mx - startX);
      let nh = Math.abs(my - startY);
      if (aspectRatio > 0) {
        nh = nw / aspectRatio;
        if (ny + nh > displayH) { nh = displayH - ny; nw = nh * aspectRatio; }
      }
      cropRect = { x: nx, y: ny, w: Math.min(nw, displayW - nx), h: Math.min(nh, displayH - ny) };
      cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
    } else if (isResizing) {
      let nx = cropRect.x, ny = cropRect.y, nw = cropRect.w, nh = cropRect.h;
      const dx = mx - (cropRect.x + cropRect.w);
      const dy = my - (cropRect.y + cropRect.h);
      if (currentDir.includes('r')) { nw = Math.max(20, startW + dx); if (aspectRatio > 0) nh = nw / aspectRatio; }
      if (currentDir.includes('b')) { nh = Math.max(20, startH + dy); if (aspectRatio > 0) nw = nh * aspectRatio; }
      if (currentDir.includes('l')) { const right = cropRect.x + cropRect.w; nx = right - nw; }
      if (currentDir.includes('t')) { const bottom = cropRect.y + cropRect.h; ny = bottom - nh; }
      if (nx < 0) { nx = 0; nw = Math.min(nw, cropRect.x + cropRect.w); }
      if (ny < 0) { ny = 0; nh = Math.min(nh, cropRect.y + cropRect.h); }
      if (nx + nw > displayW) { nw = displayW - nx; if (aspectRatio > 0) nh = nw / aspectRatio; }
      if (ny + nh > displayH) { nh = displayH - ny; if (aspectRatio > 0) nw = nh * aspectRatio; }
      cropRect = { x: nx, y: ny, w: Math.max(20, nw), h: Math.max(20, nh) };
      cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
    } else if (isMoving) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let nx = cropRect.x + dx, ny = cropRect.y + dy;
      if (nx < 0) nx = 0; if (ny < 0) ny = 0;
      if (nx + cropRect.w > displayW) nx = displayW - cropRect.w;
      if (ny + cropRect.h > displayH) ny = displayH - cropRect.h;
      cropRect = { ...cropRect, x: nx, y: ny };
      cropBox.style.cssText = \`left:\${nx}px;top:\${ny}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(nx, ny, cropRect.w, cropRect.h, scaleX, scaleY);
      startX = e.clientX;
      startY = e.clientY;
    }
  };

  document.onmouseup = function() {
    isDragging = false; isResizing = false; isMoving = false;
  };

  // Touch support
  overlay.ontouchstart = function(e) {
    const touch = e.touches[0];
    const rect = wrapper.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
    if (mx >= cropRect.x && mx <= cropRect.x + cropRect.w && my >= cropRect.y && my <= cropRect.y + cropRect.h) {
      isMoving = true;
      startX = touch.clientX;
      startY = touch.clientY;
      return;
    }
    isDragging = true;
    cropRect = { x: mx, y: my, w: 0, h: 0 };
    cropBox.className = 'crop-box active';
    startX = mx;
    startY = my;
  };

  document.ontouchmove = function(e) {
    const touch = e.touches[0];
    const rect = wrapper.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
    if (isDragging) {
      let nx = Math.min(startX, mx), ny = Math.min(startY, my);
      let nw = Math.abs(mx - startX), nh = Math.abs(my - startY);
      if (aspectRatio > 0) { nh = nw / aspectRatio; if (ny + nh > displayH) { nh = displayH - ny; nw = nh * aspectRatio; } }
      cropRect = { x: nx, y: ny, w: Math.min(nw, displayW - nx), h: Math.min(nh, displayH - ny) };
      cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
    } else if (isMoving) {
      const dx = touch.clientX - startX, dy = touch.clientY - startY;
      let nx = cropRect.x + dx, ny = cropRect.y + dy;
      if (nx < 0) nx = 0; if (ny < 0) ny = 0;
      if (nx + cropRect.w > displayW) nx = displayW - cropRect.w;
      if (ny + cropRect.h > displayH) ny = displayH - cropRect.h;
      cropRect = { ...cropRect, x: nx, y: ny };
      cropBox.style.cssText = \`left:\${nx}px;top:\${ny}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(nx, ny, cropRect.w, cropRect.h, scaleX, scaleY);
      startX = touch.clientX;
      startY = touch.clientY;
    }
  };

  document.ontouchend = function() { isDragging = false; isMoving = false; };

  // Resize handles
  document.querySelectorAll('.resize-handle').forEach(h => {
    h.onmousedown = function(e) {
      isResizing = true; currentDir = this.dataset.dir;
      startW = cropRect.w; startH = cropRect.h;
      e.stopPropagation(); e.preventDefault();
    };
  });

  // Aspect ratio buttons
  document.querySelectorAll('.aspect-btn').forEach(b => {
    b.onclick = function() {
      document.querySelectorAll('.aspect-btn').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      const ratio = this.dataset.ratio;
      if (ratio === 'free') { aspectRatio = 0; return; }
      const parts = ratio.split(':').map(Number);
      aspectRatio = parts[0] / parts[1];
      if (cropRect) {
        let nh = cropRect.w / aspectRatio;
        if (cropRect.y + nh > displayH) { nh = displayH - cropRect.y; }
        cropRect.h = nh;
        cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
        updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
      }
    };
  });
};

function showCrop(x, y, w, h) {
  cropRect = { x, y, w, h };
  cropBox.className = 'crop-box active';
  cropBox.style.cssText = \`left:\${x}px;top:\${y}px;width:\${w}px;height:\${h}px\`;
}

function updateCropInfo(x, y, w, h, sx, sy) {
  const nw = Math.round(w * sx), nh = Math.round(h * sy);
  cropInfo.textContent = \`\${nw} × \${nh}px  位置(\${Math.round(x * sx)}, \${Math.round(y * sy)})\`;
}

function resetCrop() {
  const displayW = img.width, displayH = img.height;
  const dw = displayW * 0.7, dh = displayH * 0.7;
  showCrop((displayW - dw) / 2, (displayH - dh) / 2, dw, dh);
}

function doCrop() {
  if (!cropRect || cropRect.w < 5 || cropRect.h < 5) return;
  cropBtn.disabled = true; cropBtn.textContent = '⏳ 裁剪中...';

  const canvas = document.createElement('canvas');
  const naturalW = img.naturalWidth, naturalH = img.naturalHeight;
  const displayW = img.width, displayH = img.height;
  const sx = naturalW / displayW, sy = naturalH / displayH;
  const nx = Math.round(cropRect.x * sx), ny = Math.round(cropRect.y * sy);
  const nw = Math.round(cropRect.w * sx), nh = Math.round(cropRect.h * sy);

  canvas.width = nw; canvas.height = nh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, nx, ny, nw, nh, 0, 0, nw, nh);

  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    resultImage.src = url;
    resultInfo.innerHTML = \`裁剪完成：\${nw} × \${nh}px  |  大小：\${(blob.size / 1024).toFixed(1)} KB\`;
    downloadBtn.onclick = function() {
      const a = document.createElement('a');
      a.href = url; a.download = 'cropped_\${nw}x\${nh}.png'; a.click();
    };
    cropContainer.style.display = 'none';
    resultContainer.classList.add('active');
    cropBtn.disabled = false; cropBtn.textContent = '✂️ 裁剪';
  }, 'image/png', 0.92);
}

function backToCrop() {
  cropContainer.style.display = 'flex';
  resultContainer.classList.remove('active');
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) doCrop();
  if (e.key === 'r' || e.key === 'R') resetCrop();
});
<\/script>
</body>
</html>`;

    return { success: true, type: 'html', data: html };
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
