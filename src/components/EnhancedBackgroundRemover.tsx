import { useState, useRef, useEffect } from 'react';
import { EraserIcon, PlusCircleIcon, DownloadIcon } from 'lucide-react';

interface Point {
  x: number;
  y: number;
  type: 'add' | 'erase';
}

export default function EnhancedBackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [processedPreview, setProcessedPreview] = useState<string>('');
  const [threshold, setThreshold] = useState(35);
  const [feather, setFeather] = useState(3);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [points, setPoints] = useState<Point[]>([]);
  const [brushSize, setBrushSize] = useState(20);
  const [mode, setMode] = useState<'add' | 'erase'>('erase');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
        setProcessedPreview('');
        setPoints([]);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const processImage = async () => {
    if (!file || !imgRef.current) return;

    setLoading(true);
    setProcessingStep('加载图片...');

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // 限制最大尺寸
      const maxW = 1200;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      setProcessingStep('识别背景...');
      await new Promise(r => setTimeout(r, 100));

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width, h = canvas.height;

      // 从四边采样背景颜色
      setProcessingStep('采样背景色...');
      const samples: { r: number; g: number; b: number }[] = [];
      const sampleCount = 30;

      for (let i = 0; i < sampleCount; i++) {
        const x = Math.round(i * w / (sampleCount - 1));
        const idx = (0 * w + Math.min(x, w - 1)) * 4;
        if (data[idx + 3] > 200) samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
      for (let i = 0; i < sampleCount; i++) {
        const x = Math.round(i * w / (sampleCount - 1));
        const idx = ((h - 1) * w + Math.min(x, w - 1)) * 4;
        if (data[idx + 3] > 200) samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
      for (let i = 0; i < sampleCount; i++) {
        const y = Math.round(i * h / (sampleCount - 1));
        const idx = (Math.min(y, h - 1) * w + 0) * 4;
        if (data[idx + 3] > 200) samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
      for (let i = 0; i < sampleCount; i++) {
        const y = Math.round(i * h / (sampleCount - 1));
        const idx = (Math.min(y, h - 1) * w + (w - 1)) * 4;
        if (data[idx + 3] > 200) samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }

      let avgR = 0, avgG = 0, avgB = 0;
      for (const s of samples) { avgR += s.r; avgG += s.g; avgB += s.b; }
      avgR = Math.round(avgR / samples.length);
      avgG = Math.round(avgG / samples.length);
      avgB = Math.round(avgB / samples.length);

      setProcessingStep('计算透明度...');
      const alphaData = new Uint8Array(w * h);

      // 第一遍：基于背景色计算透明度
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = (py * w + px) * 4;
          const dr = data[i] - avgR;
          const dg = data[i + 1] - avgG;
          const db = data[i + 2] - avgB;
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

      // 第二遍：应用用户修正点
      setProcessingStep('应用修正...');
      for (const point of points) {
        const radius = brushSize;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              const px = Math.round(point.x * scale) + dx;
              const py = Math.round(point.y * scale) + dy;
              if (px >= 0 && px < w && py >= 0 && py < h) {
                alphaData[py * w + px] = point.type === 'add' ? 255 : 0;
              }
            }
          }
        }
      }

      setProcessingStep('生成结果...');
      // 应用透明度
      for (let i = 0; i < data.length; i += 4) {
        data[i + 3] = alphaData[Math.floor(i / 4)];
      }

      ctx.putImageData(imageData, 0, 0);

      // 转换为blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          setProcessedPreview(URL.createObjectURL(blob));
        }
        setLoading(false);
        setProcessingStep('');
      }, 'image/png');

    } catch (error) {
      console.error('处理失败:', error);
      setLoading(false);
      setProcessingStep('');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPoints([...points, { x, y, type: mode }]);

    // 在canvas上绘制标记
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = mode === 'add' ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleDownload = () => {
    if (!processedPreview) return;
    const link = document.createElement('a');
    link.href = processedPreview;
    link.download = 'removed-bg.png';
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        ✂️ AI智能抠图
      </h2>

      {/* 上传区域 */}
      <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-gray-400 mb-2">点击或拖拽上传图片</div>
          <div className="text-sm text-gray-500">支持 JPG、PNG 等格式</div>
        </label>
      </div>

      {/* 参数调节 */}
      {preview && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-sm text-gray-400 mb-2">
                阈值 ({threshold}) - 控制保留范围
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>保留更多</span>
                <span>保留更少</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-sm text-gray-400 mb-2">
                羽化 ({feather}px) - 边缘过渡
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={feather}
                onChange={(e) => setFeather(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>硬边缘</span>
                <span>柔和边缘</span>
              </div>
            </div>
          </div>

          {/* 工具选择 */}
          <div className="flex gap-4">
            <button
              onClick={() => setMode('add')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mode === 'add' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <PlusCircleIcon className="w-4 h-4" />
              添加区域
            </button>
            <button
              onClick={() => setMode('erase')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mode === 'erase' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <EraserIcon className="w-4 h-4" />
              擦除区域
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">画笔大小:</span>
              <input
                type="range"
                min="10"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>

          {/* 图片预览和处理 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <div className="text-sm text-gray-400 mb-2">原始图片</div>
              <img
                src={preview}
                alt="原始"
                ref={imgRef}
                className="w-full rounded-lg"
                onLoad={() => {
                  if (canvasRef.current && preview) {
                    canvasRef.current.width = canvasRef.current.offsetWidth;
                    canvasRef.current.height = canvasRef.current.offsetHeight;
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair rounded-lg"
                onClick={handleCanvasClick}
              />
            </div>
            <div className="relative">
              <div className="text-sm text-gray-400 mb-2">处理结果</div>
              {processedPreview ? (
                <img src={processedPreview} alt="处理结果" className="w-full rounded-lg" />
              ) : (
                <div className="w-full h-64 bg-white/5 rounded-lg flex items-center justify-center text-gray-500">
                  点击"开始处理"生成结果
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={processImage}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {loading ? processingStep || '处理中...' : '✨ 开始处理'}
            </button>
            {processedPreview && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                下载 PNG
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
