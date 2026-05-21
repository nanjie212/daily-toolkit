async function x(r){try{const e=r.text,n=r.length||"medium";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入文本内容"};const s=e.replace(/([.!?。！？])\s*/g,"$1|").split("|").map(o=>o.trim()).filter(o=>o.length>5);if(s.length===0)return{success:!0,data:e.trim()};const t={},c=e.toLowerCase().split(/\s+/),a=new Set(["的","了","在","是","我","有","和","就","不","人","都","一","一个","上","也","很","到","说","要","去","你","会","着","没有","看","好","自己","这","the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","shall","can","need","dare","ought","used","to","of","in","for","on","with","at","by","from","as","into","through","during","before","after","above","below","between","out","off","over","under","again","further","then","once","and","but","or","nor","not","so","yet","both","either","neither","each","every","all","any","few","more","most","other","some","such","no","only","own","same","than","too","very","just","because","if","when","where","how","what","which","who","whom","this","that","these","those","it","its"]);c.forEach(o=>{const i=o.replace(/[^\w\u4e00-\u9fff]/g,"");i&&!a.has(i)&&(t[i]=(t[i]||0)+1)});const l=s.map((o,i)=>{const p=o.toLowerCase().split(/\s+/);let h=0;return p.forEach(f=>{const b=f.replace(/[^\w\u4e00-\u9fff]/g,"");h+=t[b]||0}),h=h/Math.max(p.length,1),i===0&&(h*=1.5),{sentence:o,score:h,index:i}}),u=Math.min({short:2,medium:4,long:6}[n]||4,s.length);return{success:!0,data:l.sort((o,i)=>i.score-o.score).slice(0,u).sort((o,i)=>o.index-i.index).map(o=>o.sentence).join(" ")}}catch(e){return{success:!1,error:`摘要失败: ${e.message}`}}}async function w(r){var e;try{const n=r.text,s=r.sourceLang||"zh",t=r.targetLang||"en";if(!(n!=null&&n.trim()))return{success:!1,error:"请输入文本内容"};const c=`${s}|${t}`,a=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(n)}&langpair=${c}`,d=await(await fetch(a)).json();if(d.responseStatus===200&&((e=d.responseData)!=null&&e.translatedText)){const u=d.responseData.translatedText,g={zh:"中文",en:"英语",ja:"日语",ko:"韩语",fr:"法语",de:"德语",es:"西班牙语",ru:"俄语"};return{success:!0,data:{原文:n,译文:u,源语言:g[s]||s,目标语言:g[t]||t,提示:"翻译由 MyMemory 提供支持，如需更高质量翻译建议使用专业翻译服务"}}}return{success:!1,error:`翻译失败: ${d.responseDetails||"未知错误"}`}}catch(n){return{success:!1,error:`翻译失败: ${n.message}`}}}async function y(r){try{const e=r.language||"zh-CN",n=window;if(!(n.SpeechRecognition||n.webkitSpeechRecognition))return{success:!1,error:"您的浏览器不支持语音识别功能",提示:"请使用 Chrome 浏览器，并确保已授权麦克风权限"};const t={"zh-CN":"中文","en-US":"英文","ja-JP":"日文","ko-KR":"韩文","fr-FR":"法文","de-DE":"德文","es-ES":"西班牙文"},c=`<!DOCTYPE html>
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
    <p class="subtitle">识别语言: ${t[e]||e}</p>
    
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
      recognition.lang = '${e}';
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
  <\/script>
</body>
</html>`,a=new Blob([c],{type:"text/html"}),l=URL.createObjectURL(a);return{success:!0,data:{状态:"已生成语音识别页面",识别语言:t[e]||e,提示:"点击「下载」保存HTML文件，用Chrome浏览器打开即可进行语音识别"},downloadUrl:l,filename:"speech-to-text.html"}}catch(e){return{success:!1,error:`语音识别初始化失败: ${e.message}`}}}async function v(r){try{const e=r.text,n=Number(r.rate??1);if(!(e!=null&&e.trim()))return{success:!1,error:"请输入要朗读的文字"};if(!("speechSynthesis"in window))return{success:!1,error:"您的浏览器不支持语音合成功能"};window.speechSynthesis.cancel();const s=new SpeechSynthesisUtterance(e);s.rate=n,s.lang="zh-CN";const c=window.speechSynthesis.getVoices().find(l=>l.lang.startsWith("zh"));c&&(s.voice=c),window.speechSynthesis.speak(s);const a=n<=.7?"慢速":n<=1?"正常":n<=1.3?"快速":"极快";return{success:!0,data:`【文字转语音】

正在朗读...
文本长度: ${e.length} 字
语速: ${a}

提示: 语音正在播放中，如需停止请刷新页面。`}}catch(e){return{success:!1,error:e.message}}}async function R(r){try{const e=r.signerName,n=r.color||"#000000",s=r.fontStyle||"cursive";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入签名者姓名"};const t=document.createElement("canvas");t.width=400,t.height=200;const c=t.getContext("2d");c.clearRect(0,0,t.width,t.height);const l={cursive:"cursive",serif:"serif",fantasy:"fantasy"}[s]||"cursive";c.font=`bold 72px ${l}`,c.fillStyle=n,c.textAlign="center",c.textBaseline="middle",c.fillText(e,t.width/2,t.height/2);const d=await new Promise((g,m)=>{t.toBlob(o=>o?g(o):m(new Error("签名生成失败")),"image/png")}),u=URL.createObjectURL(d);return{success:!0,data:{签名者:e,字体风格:s==="cursive"?"手写体":s==="serif"?"楷体":"艺术体",笔迹颜色:n,图片尺寸:`${t.width} x ${t.height} px`,文件大小:`${(d.size/1024).toFixed(1)} KB`,提示:"签名图片为透明背景PNG，可直接用于文档签署"},downloadUrl:u,filename:`signature-${e}.png`}}catch(e){return{success:!1,error:e.message}}}export{R as eSignature,y as speechToText,x as textSummary,v as textToSpeech,w as textTranslate};
