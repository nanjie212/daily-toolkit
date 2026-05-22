import { useState, useRef } from 'react';
import { DownloadIcon, WandIcon, UserIcon, PaletteIcon } from 'lucide-react';

type Intensity = 'light' | 'medium' | 'heavy';
type ColorStyle = 'natural' | 'vintage' | 'cool' | 'warm';

export default function EnhancedPhotoRestorer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [restoredPreview, setRestoredPreview] = useState<string>('');
  const [colorizedPreview, setColorizedPreview] = useState<string>('');
  const [intensity, setIntensity] = useState<Intensity>('medium');
  const [colorStyle, setColorStyle] = useState<ColorStyle>('natural');
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
        setRestoredPreview('');
        setColorizedPreview('');
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const processRestoration = async () => {
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

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width, h = canvas.height;

      // 强度参数
      const strength = intensity === 'light' ? 0.5 : intensity === 'medium' ? 1.0 : 1.5;

      setProcessingStep('去黄褪色...');
      await new Promise(r => setTimeout(r, 50));

      // 步骤1: 去除黄斑/褪色
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if ((r > 150 && g > 120 && b < 100) || (r > 170 && g > 150 && b < 120)) {
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          const blend = 0.6 * strength;
          data[i] = Math.min(255, Math.round(r * (1 - blend) + gray * blend + 15));
          data[i + 1] = Math.min(255, Math.round(g * (1 - blend) + gray * blend));
          data[i + 2] = Math.max(0, Math.round(b * (1 - blend) + gray * blend - 10));
        }
      }

      setProcessingStep('降噪处理...');
      await new Promise(r => setTimeout(r, 50));

      // 步骤2: 降噪
      const tempData = new Uint8ClampedArray(data);
      const noiseReduction = 0.25 * strength;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                sum += tempData[((y + dy) * w + (x + dx)) * 4 + c];
              }
            }
            const avg = sum / 9;
            const original = tempData[(y * w + x) * 4 + c];
            data[(y * w + x) * 4 + c] = Math.max(0, Math.min(255,
              Math.round(original * (1 - noiseReduction) + avg * noiseReduction)
            ));
          }
        }
      }

      setProcessingStep('增强对比度...');
      await new Promise(r => setTimeout(r, 50));

      // 步骤3: 自适应对比度增强
      let totalLum = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLum = totalLum / (data.length / 4);
      const contrastFactor = (avgLum < 100 ? 1.3 : avgLum > 180 ? 1.1 : 1.2) * strength;
      const factor = (259 * (128 * contrastFactor - 128 + 255)) / (255 * (259 - 128 * contrastFactor + 128));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, Math.round(factor * (data[i] - 128) + 128)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(factor * (data[i + 1] - 128) + 128)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(factor * (data[i + 2] - 128) + 128)));
      }

      setProcessingStep('锐化处理...');
      await new Promise(r => setTimeout(r, 50));

      // 步骤4: USM锐化
      const sharpenAmount = 0.4 * strength;
      const output = new Uint8ClampedArray(data.length);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let blur = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                blur += data[((y + dy) * w + (x + dx)) * 4 + c];
              }
            }
            blur /= 9;
            const original = data[(y * w + x) * 4 + c];
            output[(y * w + x) * 4 + c] = Math.max(0, Math.min(255,
              Math.round(original + sharpenAmount * (original - blur))
            ));
          }
          output[(y * w + x) * 4 + 3] = data[(y * w + x) * 4 + 3];
        }
      }
      imageData.data.set(output);
      ctx.putImageData(imageData, 0, 0);

      setProcessingStep('生成结果...');
      canvas.toBlob((blob) => {
        if (blob) {
          setRestoredPreview(URL.createObjectURL(blob));
        }
        setLoading(false);
        setProcessingStep('');
      }, 'image/jpeg', 0.95);

    } catch (error) {
      console.error('修复失败:', error);
      setLoading(false);
      setProcessingStep('');
    }
  };

  const processColorization = async () => {
    if (!restoredPreview) return;

    setLoading(true);
    setProcessingStep('分析图片...');

    try {
      const img = new Image();
      img.src = restoredPreview;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      setProcessingStep('上色处理...');

      // 分析图片亮度分布
      let darkPixels = 0, midPixels = 0, lightPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < 85) darkPixels++;
        else if (lum < 170) midPixels++;
        else lightPixels++;
      }

      // 根据风格上色
      const styleParams = {
        natural: { sky: [135, 206, 235], grass: [76, 175, 80], skin: [255, 220, 177], shadow: [180, 140, 110] },
        vintage: { sky: [176, 196, 222], grass: [107, 142, 107], skin: [255, 228, 196], shadow: [139, 90, 43] },
        cool: { sky: [70, 130, 180], grass: [60, 90, 60], skin: [255, 218, 185], shadow: [100, 100, 130] },
        warm: { sky: [255, 180, 120], grass: [154, 205, 50], skin: [255, 235, 205], shadow: [180, 120, 80] },
      }[colorStyle];

      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const gray = data[i]; // 原始灰度

        // 根据亮度和颜色位置（简化版上色）
        let newR, newG, newB;

        if (lum < 85) {
          // 暗部 - 使用阴影色
          const blend = (85 - lum) / 85;
          newR = Math.round(gray * (1 - blend) + styleParams.skin[0] * blend * 0.7);
          newG = Math.round(gray * (1 - blend) + styleParams.skin[1] * blend * 0.7);
          newB = Math.round(gray * (1 - blend) + styleParams.skin[2] * blend * 0.7);
        } else if (lum < 170) {
          // 中间调 - 肤色为主
          const midLum = (lum - 85) / 85;
          newR = Math.round(gray * (1 - midLum * 0.3) + styleParams.skin[0] * midLum * 0.3);
          newG = Math.round(gray * (1 - midLum * 0.3) + styleParams.skin[1] * midLum * 0.3);
          newB = Math.round(gray * (1 - midLum * 0.3) + styleParams.skin[2] * midLum * 0.3);
        } else {
          // 亮部 - 轻微上色
          const blend = (lum - 170) / 85;
          newR = Math.min(255, Math.round(gray + styleParams.sky[0] * blend * 0.2));
          newG = Math.min(255, Math.round(gray + styleParams.sky[1] * blend * 0.2));
          newB = Math.min(255, Math.round(gray + styleParams.sky[2] * blend * 0.2));
        }

        // 添加轻微的色彩饱和度
        const saturationBoost = 1.15;
        const avg = (newR + newG + newB) / 3;
        newR = Math.min(255, Math.round(avg + (newR - avg) * saturationBoost));
        newG = Math.min(255, Math.round(avg + (newG - avg) * saturationBoost));
        newB = Math.min(255, Math.round(avg + (newB - avg) * saturationBoost));

        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setColorizedPreview(URL.createObjectURL(blob));
        }
        setLoading(false);
        setProcessingStep('');
      }, 'image/jpeg', 0.95);

    } catch (error) {
      console.error('上色失败:', error);
      setLoading(false);
      setProcessingStep('');
    }
  };

  const handleDownload = (type: 'restored' | 'colorized') => {
    const url = type === 'restored' ? restoredPreview : colorizedPreview;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = type === 'restored' ? 'restored-photo.jpg' : 'colorized-photo.jpg';
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        📷 增强版老照片修复
      </h2>

      {/* 上传区域 */}
      <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer">
          <div className="text-gray-400 mb-2">点击上传老照片</div>
          <div className="text-sm text-gray-500">支持 JPG、PNG 等格式</div>
        </label>
      </div>

      {/* 参数选择 */}
      {preview && (
        <>
          {/* 修复强度 */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <WandIcon className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-white">修复强度</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'medium', 'heavy'] as Intensity[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  className={`py-2 px-4 rounded-lg text-sm transition-colors ${
                    intensity === level
                      ? 'bg-accent text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {level === 'light' && '🌟 轻度修复'}
                  {level === 'medium' && '✨ 中度修复'}
                  {level === 'heavy' && '💫 重度修复'}
                </button>
              ))}
            </div>
          </div>

          {/* 修复按钮 */}
          <button
            onClick={processRestoration}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            {loading ? processingStep || '处理中...' : '🔧 开始基础修复'}
          </button>

          {/* 修复结果对比 */}
          {restoredPreview && (
            <>
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-white">基础修复完成</span>
                  </div>
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {showComparison ? '隐藏对比' : '显示对比'}
                  </button>
                </div>

                {showComparison && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">修复前</div>
                      <img src={preview} alt="修复前" className="w-full rounded-lg" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">修复后</div>
                      <img src={restoredPreview} alt="修复后" className="w-full rounded-lg" />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleDownload('restored')}
                  className="w-full py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  下载修复后的照片
                </button>
              </div>

              {/* 上色功能 */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PaletteIcon className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">黑白照片上色</span>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(['natural', 'vintage', 'cool', 'warm'] as ColorStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setColorStyle(style)}
                      className={`py-2 px-3 rounded-lg text-xs transition-colors ${
                        colorStyle === style
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {style === 'natural' && '🎨 自然色'}
                      {style === 'vintage' && '📜 复古色调'}
                      {style === 'cool' && '❄️ 冷色调'}
                      {style === 'warm' && '🔥 暖色调'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={processColorization}
                  disabled={loading}
                  className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  {loading ? '上色中...' : '🎨 为照片上色'}
                </button>

                {colorizedPreview && (
                  <div className="mt-4">
                    <div className="text-xs text-gray-400 mb-2">上色结果</div>
                    <img src={colorizedPreview} alt="上色结果" className="w-full rounded-lg mb-3" />
                    <button
                      onClick={() => handleDownload('colorized')}
                      className="w-full py-2 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      下载上色后的照片
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* 隐藏的图片引用 */}
      <img ref={imgRef} src={preview} alt="" className="hidden" />
    </div>
  );
}
