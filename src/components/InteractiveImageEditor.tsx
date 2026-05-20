import { useState, useRef, useCallback, useEffect } from 'react';
import { MoveIcon, MousePointer2Icon, SquareIcon, MinusIcon, TypeIcon, CropIcon, Undo2Icon, DownloadIcon } from 'lucide-react';

type ToolType = 'arrow' | 'rectangle' | 'circle' | 'text' | 'crop' | 'none';

interface Annotation {
  type: ToolType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  text?: string;
}

export default function InteractiveImageEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>('none');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(reader.result as string);
        imageRef.current = img;
        setAnnotations([]);
        setCurrentTool('arrow');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'none') return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    setDrawCurrent(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    setDrawCurrent(coords);
    redrawCanvas(drawStart, coords);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentTool !== 'crop') {
      setAnnotations(prev => [...prev, {
        type: currentTool,
        startX: Math.min(drawStart.x, drawCurrent.x),
        startY: Math.min(drawStart.y, drawCurrent.y),
        endX: Math.max(drawStart.x, drawCurrent.x),
        endY: Math.max(drawStart.y, drawCurrent.y),
        color: selectedColor,
      }]);
    }
    drawAllAnnotations();
  };

  const redrawCanvas = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    drawAllAnnotations();
    if (currentTool === 'none') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    if (currentTool === 'arrow') {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = selectedColor;
      ctx.fill();
    } else if (currentTool === 'rectangle') {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      ctx.fillStyle = selectedColor + '20';
      ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (currentTool === 'circle') {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = selectedColor + '20';
      ctx.fill();
    } else if (currentTool === 'crop') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, canvasRef.current?.width || 800, start.y);
      ctx.fillRect(0, end.y, canvasRef.current?.width || 800, (canvasRef.current?.height || 600) - end.y);
      ctx.fillRect(0, start.y, start.x, end.y - start.y);
      ctx.fillRect(end.x, start.y, (canvasRef.current?.width || 800) - end.x, end.y - start.y);
    }
  };

  const drawAllAnnotations = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const a of annotations) {
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      if (a.type === 'arrow') {
        const angle = Math.atan2(a.endY - a.startY, a.endX - a.startX);
        const headLen = 10;
        ctx.beginPath();
        ctx.moveTo(a.startX, a.startY);
        ctx.lineTo(a.endX, a.endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.endX, a.endY);
        ctx.lineTo(a.endX - headLen * Math.cos(angle - Math.PI / 6), a.endY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(a.endX - headLen * Math.cos(angle + Math.PI / 6), a.endY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = a.color;
        ctx.fill();
      } else if (a.type === 'rectangle') {
        ctx.strokeRect(a.startX, a.startY, a.endX - a.startX, a.endY - a.startY);
        ctx.fillStyle = a.color + '20';
        ctx.fillRect(a.startX, a.startY, a.endX - a.startX, a.endY - a.startY);
      } else if (a.type === 'circle') {
        const cx = (a.startX + a.endX) / 2;
        const cy = (a.startY + a.endY) / 2;
        const rx = Math.abs(a.endX - a.startX) / 2;
        const ry = Math.abs(a.endY - a.startY) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
    setTimeout(drawAllAnnotations, 0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'annotated.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCrop = () => {
    if (currentTool !== 'crop' || !imageRef.current) return;
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);
    if (w < 10 || h < 10) return;
    const img = imageRef.current;
    const oc = document.createElement('canvas');
    oc.width = w;
    oc.height = h;
    const octx = oc.getContext('2d');
    if (!octx) return;
    octx.drawImage(img, x, y, w, h, 0, 0, w, h);
    const link = document.createElement('a');
    link.download = 'cropped.png';
    link.href = oc.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4">
      {!image ? (
        <div className="border-2 border-dashed border-white/10 rounded-2xl p-16 text-center hover:border-accent/50 transition-all">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="screenshot-upload"
          />
          <label
            htmlFor="screenshot-upload"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center">
              <MousePointer2Icon className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">点击上传图片，开始标注或裁剪</p>
            <p className="text-gray-600 text-xs">支持 JPG、PNG、WebP 格式</p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap bg-surface border border-white/5 rounded-xl p-3">
            <button
              onClick={() => setCurrentTool('arrow')}
              className={`p-2 rounded-lg transition-all ${currentTool === 'arrow' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="箭头"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentTool('rectangle')}
              className={`p-2 rounded-lg transition-all ${currentTool === 'rectangle' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="矩形"
            >
              <SquareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentTool('circle')}
              className={`p-2 rounded-lg transition-all ${currentTool === 'circle' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="椭圆"
            >
              <MoveIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentTool('crop')}
              className={`p-2 rounded-lg transition-all ${currentTool === 'crop' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="裁剪"
            >
              <CropIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              title="颜色"
            />
            <button
              onClick={handleUndo}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title="撤销"
            >
              <Undo2Icon className="w-4 h-4" />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCrop}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTool === 'crop' ? 'bg-accent text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              执行裁剪
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-all"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              下载
            </button>
          </div>

          <div ref={containerRef} className="relative bg-surface rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="max-w-full max-h-[70vh] cursor-crosshair"
              style={currentTool === 'none' ? { cursor: 'default' } : undefined}
            />
            {image && (
              <img
                ref={imageRef}
                src={image}
                alt="原图"
                className="hidden"
                onLoad={() => {
                  const img = imageRef.current;
                  const canvas = canvasRef.current;
                  if (!img || !canvas) return;
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  ctx.drawImage(img, 0, 0);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}