import type { ToolOutput } from '@/types';

export async function videoToGif(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const width = Math.min(640, Math.max(100, Number(input.width ?? 320)));
    const fps = Number(input.fps ?? 10);
    const duration = Math.min(10, Math.max(1, Number(input.duration ?? 3)));

    if (!file) return { success: false, error: '请选择视频文件' };

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('视频加载失败'));
      video.load();
    });

    const canvas = document.createElement('canvas');
    const aspectRatio = video.videoHeight / video.videoWidth;
    canvas.width = width;
    canvas.height = Math.round(width * aspectRatio);
    const ctx = canvas.getContext('2d')!;

    const frameCount = fps * duration;
    const frameInterval = 1 / fps;
    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      video.currentTime = i * frameInterval;
      await new Promise<void>(resolve => { video.onseeked = () => resolve(); });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/png'));
    }

    URL.revokeObjectURL(url);

    const delay = Math.round(1000 / fps);

    const gifBlob = await createSimpleGif(frames, canvas.width, canvas.height, delay);

    const downloadUrl = URL.createObjectURL(gifBlob);

    return {
      success: true,
      data: {
        视频时长: `${Math.min(duration, video.duration).toFixed(1)} 秒`,
        GIF尺寸: `${canvas.width} x ${canvas.height}`,
        帧数: frameCount,
        帧率: `${fps} FPS`,
        文件大小: `${(gifBlob.size / 1024).toFixed(1)} KB`,
      },
      downloadUrl,
      filename: 'output.gif',
    };
  } catch (e) {
    return { success: false, error: `视频转GIF失败: ${(e as Error).message}` };
  }
}

async function createSimpleGif(frames: string[], width: number, height: number, delay: number): Promise<Blob> {
  const { encode } = await import('modern-gif');
  const canvasElements: HTMLCanvasElement[] = [];

  for (const frame of frames) {
    const img = new Image();
    img.src = frame;
    await new Promise<void>(resolve => { img.onload = () => resolve(); });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);
    canvasElements.push(canvas);
  }

  const buffer = await encode({
    width,
    height,
    format: 'blob',
    frames: canvasElements.map(canvas => ({
      data: canvas,
      delay,
    })),
  });

  return buffer;
}
