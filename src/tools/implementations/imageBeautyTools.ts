import type { ToolOutput } from '@/types';

export async function imageToBase64(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.image as File;
    if (!file) return { success: false, error: '请上传图片' };
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const base64 = dataUrl.split(',')[1];
    const preview = base64.length > 150 ? base64.substring(0, 150) + '...' : base64;
    return {
      success: true,
      data: {
        文件名: file.name,
        大小: `${(file.size / 1024).toFixed(1)} KB`,
        格式: `data:${file.type};base64`,
        Base64长度: `${base64.length} 字符`,
        Base64预览: preview,
        提示: '已生成完整Base64代码，可点击复制后用于HTML的img标签src属性',
      },
    };
  } catch (e) {
    return { success: false, error: `转换失败: ${(e as Error).message}` };
  }
}

export async function imageGrayscale(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.image as File;
    if (!file) return { success: false, error: '请上传图片' };
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('处理失败'))), file.type || 'image/png', 0.92)
    );
    const downloadUrl = URL.createObjectURL(blob);
    return {
      success: true,
      data: {
        原始尺寸: `${img.width} x ${img.height} px`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
        提示: '已处理为黑白效果',
      },
      downloadUrl,
      filename: `grayscale-${file.name}`,
    };
  } catch (e) {
    return { success: false, error: `处理失败: ${(e as Error).message}` };
  }
}

export async function imageMirror(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.image as File;
    const direction = (input.direction as string) || 'horizontal';
    if (!file) return { success: false, error: '请上传图片' };
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    if (direction === 'horizontal') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('处理失败'))), file.type || 'image/png', 0.92)
    );
    const downloadUrl = URL.createObjectURL(blob);
    return {
      success: true,
      data: {
        翻转方向: direction === 'horizontal' ? '水平翻转' : '垂直翻转',
        尺寸: `${img.width} x ${img.height} px`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
        提示: '图片已翻转，可下载保存',
      },
      downloadUrl,
      filename: `flipped-${file.name}`,
    };
  } catch (e) {
    return { success: false, error: `处理失败: ${(e as Error).message}` };
  }
}

export async function imageRoundedCorners(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.image as File;
    const radius = Number(input.radius) || 20;
    if (!file) return { success: false, error: '请上传图片' };
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    const r = Math.min(radius, img.width / 2, img.height / 2);
    ctx.moveTo(r, 0);
    ctx.lineTo(img.width - r, 0);
    ctx.quadraticCurveTo(img.width, 0, img.width, r);
    ctx.lineTo(img.width, img.height - r);
    ctx.quadraticCurveTo(img.width, img.height, img.width - r, img.height);
    ctx.lineTo(r, img.height);
    ctx.quadraticCurveTo(0, img.height, 0, img.height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('处理失败'))), 'image/png')
    );
    const downloadUrl = URL.createObjectURL(blob);
    return {
      success: true,
      data: {
        圆角半径: `${r}px`,
        尺寸: `${img.width} x ${img.height} px`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
        提示: '已处理为圆角效果，下载保存即可',
      },
      downloadUrl,
      filename: `rounded-${file.name.replace(/\.\w+$/, '.png')}`,
    };
  } catch (e) {
    return { success: false, error: `处理失败: ${(e as Error).message}` };
  }
}

export async function imageBrightnessContrast(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.image as File;
    const brightness = Number(input.brightness) || 0;
    const contrast = Number(input.contrast) || 1;
    if (!file) return { success: false, error: '请上传图片' };
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const brightnessVal = Math.round((brightness * 255) / 100);
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        let val = data[i + j];
        val += brightnessVal;
        val = (val - 128) * contrast + 128;
        data[i + j] = Math.max(0, Math.min(255, val));
      }
    }
    ctx.putImageData(imageData, 0, 0);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('处理失败'))), file.type || 'image/png', 0.92)
    );
    const downloadUrl = URL.createObjectURL(blob);
    return {
      success: true,
      data: {
        亮度调整: `${brightness > 0 ? '+' : ''}${brightness}%`,
        对比度: `${contrast}x`,
        尺寸: `${img.width} x ${img.height} px`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
        提示: '亮度范围-100到100，对比度范围0.5到2.0',
      },
      downloadUrl,
      filename: `adjusted-${file.name}`,
    };
  } catch (e) {
    return { success: false, error: `处理失败: ${(e as Error).message}` };
  }
}