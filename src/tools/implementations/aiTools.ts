import type { ToolOutput } from '@/types';

export async function textSummary(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const length = (input.length as string) || 'medium';

    if (!text?.trim()) return { success: false, error: '请输入文本内容' };

    const sentences = text
      .replace(/([.!?。！？])\s*/g, '$1|')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    if (sentences.length === 0) return { success: true, data: text.trim() };

    const wordFreq: Record<string, number> = {};
    const allWords = text.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
      '自己', '这', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
      'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
      'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further',
      'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
      'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
      'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what',
      'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'it', 'its',
    ]);

    allWords.forEach((word) => {
      const w = word.replace(/[^\w\u4e00-\u9fff]/g, '');
      if (w && !stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });

    const scored = sentences.map((sentence, index) => {
      const words = sentence.toLowerCase().split(/\s+/);
      let score = 0;
      words.forEach((word) => {
        const w = word.replace(/[^\w\u4e00-\u9fff]/g, '');
        score += wordFreq[w] || 0;
      });
      score = score / Math.max(words.length, 1);
      if (index === 0) score *= 1.5;
      return { sentence, score, index };
    });

    const countMap: Record<string, number> = { short: 2, medium: 4, long: 6 };
    const count = Math.min(countMap[length] || 4, sentences.length);

    const top = scored.sort((a, b) => b.score - a.score).slice(0, count);
    const summary = top
      .sort((a, b) => a.index - b.index)
      .map((s) => s.sentence)
      .join(' ');

    return { success: true, data: summary };
  } catch (e) {
    return { success: false, error: `摘要失败: ${(e as Error).message}` };
  }
}

export async function textToSpeech(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const rate = Number(input.rate ?? 1);

    if (!text?.trim()) return { success: false, error: '请输入要朗读的文字' };

    if (!('speechSynthesis' in window)) {
      return { success: false, error: '您的浏览器不支持语音合成功能' };
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.lang = 'zh-CN';

    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) utterance.voice = zhVoice;

    window.speechSynthesis.speak(utterance);

    const rateLabel = rate <= 0.7 ? '慢速' : rate <= 1 ? '正常' : rate <= 1.3 ? '快速' : '极快';

    return {
      success: true,
      data: `【文字转语音】\n\n正在朗读...\n文本长度: ${text.length} 字\n语速: ${rateLabel}\n\n提示: 语音正在播放中，如需停止请刷新页面。`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function eSignature(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const signerName = input.signerName as string;
    const color = (input.color as string) || '#000000';
    const fontStyle = (input.fontStyle as string) || 'cursive';

    if (!signerName?.trim()) return { success: false, error: '请输入签名者姓名' };

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fontMap: Record<string, string> = {
      cursive: 'cursive',
      serif: 'serif',
      fantasy: 'fantasy',
    };
    const fontFamily = fontMap[fontStyle] || 'cursive';

    ctx.font = `bold 72px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signerName, canvas.width / 2, canvas.height / 2);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('签名生成失败'))),
        'image/png'
      );
    });

    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        签名者: signerName,
        字体风格: fontStyle === 'cursive' ? '手写体' : fontStyle === 'serif' ? '楷体' : '艺术体',
        笔迹颜色: color,
        图片尺寸: `${canvas.width} x ${canvas.height} px`,
        文件大小: `${(blob.size / 1024).toFixed(1)} KB`,
        提示: '签名图片为透明背景PNG，可直接用于文档签署',
      },
      downloadUrl,
      filename: `signature-${signerName}.png`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
