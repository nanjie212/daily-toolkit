import { useState, useRef, useCallback } from 'react';
import {
  MousePointer2Icon, SquareIcon, MinusIcon, TypeIcon, CropIcon,
  Undo2Icon, Redo2Icon, DownloadIcon, PencilIcon, CircleIcon, EraserIcon,
} from 'lucide-react';

type ToolType = 'arrow' | 'rectangle' | 'circle' | 'freehand' | 'text' | 'mosaic' | 'crop' | 'none';

interface Annotation {
  type: ToolType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  text?: string;
  lineWidth?: number;
  points?: { x: number; y: number }[];
}

export default function InteractiveImageEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>('none');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
        setUndoStack([]);
        setCurrentTool('arrow');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const drawBaseImage = (ctx: CanvasRenderingContext2D) => {
    const img = imageRef.current;
    if (img) {
      ctx.drawImage(img, 0, 0);
    }
  };

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
    if (currentTool === 'freehand') {
      setFreehandPoints([coords]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    setDrawCurrent(coords);
    if (currentTool === 'freehand') {
      setFreehandPoints(prev => [...prev, coords]);
    }
    redrawCanvas(drawStart, coords);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentTool !== 'crop' && currentTool !== 'text') {
      setUndoStack(prev => [...prev, annotations]);
      setAnnotations(prev => [...prev, {
        type: currentTool,
        startX: Math.min(drawStart.x, drawCurrent.x),
        startY: Math.min(drawStart.y, drawCurrent.y),
        endX: Math.max(drawStart.x, drawCurrent.x),
        endY: Math.max(drawStart.y, drawCurrent.y),
        color: selectedColor,
        lineWidth,
        points: currentTool === 'freehand' ? [...freehandPoints] : undefined,
      }]);
      setFreehandPoints([]);
    }
    if (currentTool === 'text') {
      const text = prompt('请输入标注文字：', '');
      if (!text) return;
      setUndoStack(prev => [...prev, annotations]);
      setAnnotations(prev => [...prev, {
        type: 'text',
        startX: drawStart.x,
        startY: drawStart.y,
        endX: drawStart.x,
        endY: drawStart.y,
        color: selectedColor,
        text,
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
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'arrow') {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = Math.max(12, lineWidth * 4);
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
      ctx.fillStyle = selectedColor + '15';
      ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (currentTool === 'circle') {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = selectedColor + '15';
      ctx.fill();
    } else if (currentTool === 'freehand') {
      if (freehandPoints.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(freehandPoints[0].x, freehandPoints[0].y);
      for (let i = 1; i < freehandPoints.length; i++) {
        ctx.lineTo(freehandPoints[i].x, freehandPoints[i].y);
      }
      ctx.stroke();
    } else if (currentTool === 'text') {
      ctx.fillStyle = selectedColor;
      ctx.font = `${Math.max(14, lineWidth * 5)}px sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText('文字', end.x, end.y);
    } else if (currentTool === 'mosaic') {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      const mosaicSize = Math.max(4, lineWidth * 2);
      const imageData = ctx.getImageData(x, y, w, h);
      for (let my = 0; my < h; my += mosaicSize) {
        for (let mx = 0; mx < w; mx += mosaicSize) {
          let r = 0, g = 0, b = 0, count = 0;
          const tileH = Math.min(mosaicSize, h - my);
          const tileW = Math.min(mosaicSize, w - mx);
          for (let ty = 0; ty < tileH; ty++) {
            for (let tx = 0; tx < tileW; tx++) {
              const idx = ((my + ty) * w + (mx + tx)) * 4;
              r += imageData.data[idx];
              g += imageData.data[idx + 1];
              b += imageData.data[idx + 2];
              count++;
            }
          }
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          for (let ty = 0; ty < tileH; ty++) {
            for (let tx = 0; tx < tileW; tx++) {
              const idx = ((my + ty) * w + (mx + tx)) * 4;
              imageData.data[idx] = r;
              imageData.data[idx + 1] = g;
              imageData.data[idx + 2] = b;
            }
          }
        }
      }
      ctx.putImageData(imageData, x, y);
    } else if (currentTool === 'crop') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      const cw = canvasRef.current?.width || 0;
      const ch = canvasRef.current?.height || 0;
      const sx = Math.min(start.x, end.x);
      const sy = Math.min(start.y, end.y);
      const sw = Math.abs(end.x - start.x);
      const sh = Math.abs(end.y - start.y);
      ctx.fillRect(0, 0, cw, sy);
      ctx.fillRect(0, sy + sh, cw, ch - sy - sh);
      ctx.fillRect(0, sy, sx, sh);
      ctx.fillRect(sx + sw, sy, cw - sx - sw, sh);
      ctx.setLineDash([]);
    }
  };

  const drawAllAnnotations = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBaseImage(ctx);
    for (const a of annotations) {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = a.lineWidth ?? 2;
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (a.type === 'arrow') {
        const angle = Math.atan2(a.endY - a.startY, a.endX - a.startX);
        const headLen = Math.max(12, (a.lineWidth ?? 2) * 4);
        ctx.beginPath();
        ctx.moveTo(a.startX, a.startY);
        ctx.lineTo(a.endX, a.endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.endX, a.endY);
        ctx.lineTo(a.endX - headLen * Math.cos(angle - Math.PI / 6), a.endY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(a.endX - headLen * Math.cos(angle + Math.PI / 6), a.endY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (a.type === 'rectangle') {
        ctx.strokeRect(a.startX, a.startY, a.endX - a.startX, a.endY - a.startY);
        ctx.fillStyle = a.color + '15';
        ctx.fillRect(a.startX, a.startY, a.endX - a.startX, a.endY - a.startY);
      } else if (a.type === 'circle') {
        const cx = (a.startX + a.endX) / 2;
        const cy = (a.startY + a.endY) / 2;
        const rx = Math.abs(a.endX - a.startX) / 2;
        const ry = Math.abs(a.endY - a.startY) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = a.color + '15';
        ctx.fill();
      } else if (a.type === 'freehand' && a.points && a.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let i = 1; i < a.points.length; i++) {
          ctx.lineTo(a.points[i].x, a.points[i].y);
        }
        ctx.stroke();
      } else if (a.type === 'text' && a.text) {
        ctx.font = `${Math.max(14, (a.lineWidth ?? 2) * 5)}px sans-serif`;
        ctx.textBaseline = 'bottom';
        ctx.fillText(a.text, a.startX, a.startY);
      } else if (a.type === 'mosaic') {
        const mosaicSize = Math.max(4, (a.lineWidth ?? 2) * 2);
        const w = a.endX - a.startX;
        const h = a.endY - a.startY;
        if (w <= 0 || h <= 0) continue;
        const imageData = ctx.getImageData(a.startX, a.startY, w, h);
        for (let my = 0; my < h; my += mosaicSize) {
          for (let mx = 0; mx < w; mx += mosaicSize) {
            let r = 0, g = 0, b = 0, count = 0;
            const tileH = Math.min(mosaicSize, h - my);
            const tileW = Math.min(mosaicSize, w - mx);
            for (let ty = 0; ty < tileH; ty++) {
              for (let tx = 0; tx < tileW; tx++) {
                const idx = ((my + ty) * w + (mx + tx)) * 4;
                r += imageData.data[idx];
                g += imageData.data[idx + 1];
                b += imageData.data[idx + 2];
                count++;
              }
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            for (let ty = 0; ty < tileH; ty++) {
              for (let tx = 0; tx < tileW; tx++) {
                const idx = ((my + ty) * w + (mx + tx)) * 4;
                imageData.data[idx] = r;
                imageData.data[idx + 1] = g;
                imageData.data[idx + 2] = b;
              }
            }
          }
        }
        ctx.putImageData(imageData, a.startX, a.startY);
      }
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setAnnotations(prev);
  };

  const handleRedo = () => {
    if (annotations.length === 0 || undoStack.length === 0) return;
    setUndoStack(prev => [...prev, annotations]);
    setAnnotations([]);
  };

  const handleReset = () => {
    setAnnotations([]);
    setUndoStack([]);
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
    if (currentTool !== 'crop') return;
    const img = imageRef.current;
    if (!img) return;
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);
    if (w < 10 || h < 10) return;

    const oc = document.createElement('canvas');
    oc.width = w;
    oc.height = h;
    const octx = oc.getContext('2d');
    if (!octx) return;
    octx.drawImage(img, x, y, w, h, 0, 0, w, h);

    setImage(oc.toDataURL('image/png'));
    imageRef.current = new Image();
    imageRef.current.src = oc.toDataURL('image/png');
    imageRef.current.width = w;
    imageRef.current.height = h;

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(imageRef.current!, 0, 0);
    }, 50);

    setAnnotations([]);
    setUndoStack([]);
    setCurrentTool('arrow');
  };

  const toolButton = (tool: ToolType, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setCurrentTool(tool)}
      className={`p-2 rounded-lg transition-all ${
        currentTool === tool ? 'bg-accent/20 text-accent ring-1 ring-accent/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
      title={label}
    >
      {icon}
    </button>
  );

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
          <div className="flex items-center gap-1.5 flex-wrap bg-surface border border-white/5 rounded-xl p-2.5">
            {toolButton('arrow', <MinusIcon className="w-4 h-4" />, '箭头')}
            {toolButton('rectangle', <SquareIcon className="w-4 h-4" />, '矩形')}
            {toolButton('circle', <CircleIcon className="w-4 h-4" />, '椭圆')}
            {toolButton('freehand', <PencilIcon className="w-4 h-4" />, '画笔')}
            {toolButton('text', <TypeIcon className="w-4 h-4" />, '文字')}
            {toolButton('mosaic', <EraserIcon className="w-4 h-4" />, '马赛克')}
            {toolButton('crop', <CropIcon className="w-4 h-4" />, '裁剪')}

            <div className="w-px h-6 bg-white/10 mx-1" />

            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              title="颜色"
            />

            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[10px]">线宽</span>
              <input
                type="range"
                min="1"
                max="12"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-16 h-1 accent-accent"
                title={`线宽: ${lineWidth}px`}
              />
              <span className="text-gray-400 text-[10px] w-4">{lineWidth}</span>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="撤销"
            >
              <Undo2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={undoStack.length === 0 && annotations.length === 0}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="重做"
            >
              <Redo2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              disabled={annotations.length === 0}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="清除全部标注"
            >
              <span className="text-xs">清除</span>
            </button>

            <div className="flex-1" />

            {currentTool === 'crop' && (
              <button
                onClick={handleCrop}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-all"
              >
                确认裁剪
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-all"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              下载
            </button>
          </div>

          <div className="relative bg-surface rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="max-w-full max-h-[70vh]"
              style={{ cursor: currentTool === 'none' ? 'default' : 'crosshair' }}
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

          <div className="text-gray-500 text-xs text-center">
            标注数：{annotations.length}
            {undoStack.length > 0 && ` · 可撤销：${undoStack.length}步`}
            {currentTool !== 'none' && (
              <span className="ml-2 text-accent/70">
                当前工具：{
                  { arrow: '箭头', rectangle: '矩形', circle: '椭圆', freehand: '画笔', text: '文字', mosaic: '马赛克', crop: '裁剪' }[currentTool]
                }
                {currentTool === 'text' ? '（点击画布添加文字）' : '（拖拽绘制）'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}