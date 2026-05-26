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

export async function textTranslate(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const sourceLang = (input.sourceLang as string) || 'zh';
    const targetLang = (input.targetLang as string) || 'en';

    if (!text?.trim()) return { success: false, error: '请输入文本内容' };

    const langPair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      const langNames: Record<string, string> = { zh: '中文', en: '英语', ja: '日语', ko: '韩语', fr: '法语', de: '德语', es: '西班牙语', ru: '俄语' };

      return {
        success: true,
        data: {
          原文: text,
          译文: translated,
          源语言: langNames[sourceLang] || sourceLang,
          目标语言: langNames[targetLang] || targetLang,
          提示: '翻译由 MyMemory 提供支持，如需更高质量翻译建议使用专业翻译服务',
        },
      };
    }

    return { success: false, error: `翻译失败: ${data.responseDetails || '未知错误'}` };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
      return { success: false, error: '翻译功能需要联网使用，请检查网络连接后重试' };
    }
    return { success: false, error: `翻译失败: ${msg}` };
  }
}

export async function speechToText(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const language = (input.language as string) || 'zh-CN';

    // 检查浏览器是否支持 Web Speech API
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognition = (win['SpeechRecognition'] || win['webkitSpeechRecognition']) as
      | { new (): { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: { results: { item: (i: number) => { item: (j: number) => { transcript: string } } }[] }) => void; onerror: (e: { error: string }) => void; onend: () => void; start: () => void; stop: () => void } }
      | undefined;

    if (!SpeechRecognition) {
      return {
        success: false,
        error: '您的浏览器不支持语音识别功能',
        提示: '请使用 Chrome 浏览器，并确保已授权麦克风权限',
      };
    }

    // 返回一个可交互的 HTML 页面
    const langNames: Record<string, string> = {
      'zh-CN': '中文',
      'en-US': '英文',
      'ja-JP': '日文',
      'ko-KR': '韩文',
      'fr-FR': '法文',
      'de-DE': '德文',
      'es-ES': '西班牙文',
    };

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>语音转文字</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #fff;
    }
    .container {
      max-width: 600px;
      width: 100%;
      text-align: center;
    }
    h1 { margin-bottom: 10px; font-size: 24px; }
    .subtitle { color: #888; margin-bottom: 30px; }
    .mic-btn {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 30px;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);
    }
    .mic-btn:hover { transform: scale(1.05); }
    .mic-btn.recording {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      animation: pulse 1.5s infinite;
      box-shadow: 0 4px 20px rgba(46, 204, 113, 0.4);
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
      50% { box-shadow: 0 0 0 20px rgba(46, 204, 113, 0); }
    }
    .mic-icon { width: 50px; height: 50px; fill: white; }
    .result-box {
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 20px;
      min-height: 150px;
      text-align: left;
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .result-text { font-size: 18px; line-height: 1.6; white-space: pre-wrap; }
    .placeholder { color: #666; font-style: italic; }
    .status { margin-top: 10px; font-size: 14px; color: #888; }
    .status.active { color: #2ecc71; }
    .btn-row { display: flex; gap: 10px; justify-content: center; }
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .btn-copy { background: #3498db; color: white; }
    .btn-clear { background: #e74c3c; color: white; }
    .btn:hover { opacity: 0.9; transform: translateY(-2px); }
    .tip { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎤 语音转文字</h1>
    <p class="subtitle">识别语言: ${langNames[language] || language}</p>
    
    <button class="mic-btn" id="micBtn" onclick="toggleRecording()">
      <svg class="mic-icon" viewBox="0 0 24 24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    </button>
    
    <p class="status" id="status">点击麦克风开始录音</p>
    
    <div class="result-box">
      <div class="result-text" id="result"><span class="placeholder">识别结果将显示在这里...</span></div>
    </div>
    
    <div class="btn-row">
      <button class="btn btn-copy" onclick="copyResult()">📋 复制文字</button>
      <button class="btn btn-clear" onclick="clearResult()">🗑️ 清空</button>
    </div>
    
    <p class="tip">💡 提示: 请使用 Chrome 浏览器，首次使用需授权麦克风权限</p>
  </div>

  <script>
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;
    let finalTranscript = '';

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = '${language}';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        document.getElementById('result').innerHTML = finalTranscript + '<span style="color:#888">' + interimTranscript + '</span>';
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('status').textContent = '错误: ' + event.error;
        document.getElementById('status').classList.remove('active');
        document.getElementById('micBtn').classList.remove('recording');
        isRecording = false;
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start();
        } else {
          document.getElementById('micBtn').classList.remove('recording');
          document.getElementById('status').textContent = '已停止录音';
          document.getElementById('status').classList.remove('active');
        }
      };
    }

    function toggleRecording() {
      if (!recognition) {
        alert('您的浏览器不支持语音识别，请使用 Chrome 浏览器');
        return;
      }
      
      if (isRecording) {
        isRecording = false;
        recognition.stop();
        document.getElementById('micBtn').classList.remove('recording');
        document.getElementById('status').textContent = '点击麦克风开始录音';
        document.getElementById('status').classList.remove('active');
      } else {
        isRecording = true;
        recognition.start();
        document.getElementById('micBtn').classList.add('recording');
        document.getElementById('status').textContent = '🔴 正在录音，请说话...';
        document.getElementById('status').classList.add('active');
      }
    }

    function copyResult() {
      const text = finalTranscript || document.getElementById('result').textContent;
      if (text && text !== '识别结果将显示在这里...') {
        navigator.clipboard.writeText(text).then(() => {
          alert('已复制到剪贴板');
        });
      } else {
        alert('没有可复制的内容');
      }
    }

    function clearResult() {
      finalTranscript = '';
      document.getElementById('result').innerHTML = '<span class="placeholder">识别结果将显示在这里...</span>';
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        状态: '已生成语音识别页面',
        识别语言: langNames[language] || language,
        提示: '点击「下载」保存HTML文件，用Chrome浏览器打开即可进行语音识别',
      },
      downloadUrl,
      filename: 'speech-to-text.html',
    };
  } catch (e) {
    return { success: false, error: `语音识别初始化失败: ${(e as Error).message}` };
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
