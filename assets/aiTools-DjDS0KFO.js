async function y(o){try{const e=o.text,t=o.length||"medium";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入文本内容"};const n=e.replace(/([.!?。！？])\s*/g,"$1|").split("|").map(r=>r.trim()).filter(r=>r.length>5);if(n.length===0)return{success:!0,data:e.trim()};const s={},c=e.toLowerCase().split(/\s+/),h=new Set(["的","了","在","是","我","有","和","就","不","人","都","一","一个","上","也","很","到","说","要","去","你","会","着","没有","看","好","自己","这","the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","shall","can","need","dare","ought","used","to","of","in","for","on","with","at","by","from","as","into","through","during","before","after","above","below","between","out","off","over","under","again","further","then","once","and","but","or","nor","not","so","yet","both","either","neither","each","every","all","any","few","more","most","other","some","such","no","only","own","same","than","too","very","just","because","if","when","where","how","what","which","who","whom","this","that","these","those","it","its"]);c.forEach(r=>{const a=r.replace(/[^\w\u4e00-\u9fff]/g,"");a&&!h.has(a)&&(s[a]=(s[a]||0)+1)});const u=n.map((r,a)=>{const w=r.toLowerCase().split(/\s+/);let g=0;return w.forEach(m=>{const p=m.replace(/[^\w\u4e00-\u9fff]/g,"");g+=s[p]||0}),g=g/Math.max(w.length,1),a===0&&(g*=1.5),{sentence:r,score:g,index:a}}),l=Math.min({short:2,medium:4,long:6}[t]||4,n.length);return{success:!0,data:u.sort((r,a)=>a.score-r.score).slice(0,l).sort((r,a)=>r.index-a.index).map(r=>r.sentence).join(" ")}}catch(e){return{success:!1,error:`摘要失败: ${e.message}`}}}async function S(o){var e;try{const t=o.text,n=o.sourceLang||"zh",s=o.targetLang||"en";if(!(t!=null&&t.trim()))return{success:!1,error:"请输入文本内容"};const c=`${n}|${s}`,h=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${c}`,i=await(await fetch(h)).json();if(i.responseStatus===200&&((e=i.responseData)!=null&&e.translatedText)){const l=i.responseData.translatedText,f={zh:"中文",en:"英语",ja:"日语",ko:"韩语",fr:"法语",de:"德语",es:"西班牙语",ru:"俄语"};return{success:!0,data:{原文:t,译文:l,源语言:f[n]||n,目标语言:f[s]||s,提示:"翻译由 MyMemory 提供支持，如需更高质量翻译建议使用专业翻译服务"}}}return{success:!1,error:`翻译失败: ${i.responseDetails||"未知错误"}`}}catch(t){return{success:!1,error:`翻译失败: ${t.message}`}}}async function b(o){try{const e=o.language||"zh-CN",t=window;return t.SpeechRecognition||t.webkitSpeechRecognition?{success:!0,data:`【语音转文字使用说明】

本工具使用浏览器内置的 Web Speech API。

使用方法:
1. 请使用 Chrome 浏览器打开本工具
2. 点击浏览器的麦克风图标授权
3. 对着麦克风说话即可实时识别
4. 识别语言: ${e==="zh-CN"?"中文":e==="en-US"?"英文":e==="ja-JP"?"日文":"韩文"}

提示: 语音识别需要联网，且仅 Chrome 浏览器支持此功能。
如需使用，请在浏览器中直接按 F12 打开控制台，输入以下代码测试:

const r = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
r.lang = '${e}';
r.onresult = e => console.log(e.results[0][0].transcript);
r.start();`}:{success:!1,error:"您的浏览器不支持语音识别功能。请使用Chrome浏览器，并确保已授权麦克风权限。"}}catch(e){return{success:!1,error:e.message}}}async function x(o){try{const e=o.text,t=Number(o.rate??1);if(!(e!=null&&e.trim()))return{success:!1,error:"请输入要朗读的文字"};if(!("speechSynthesis"in window))return{success:!1,error:"您的浏览器不支持语音合成功能"};window.speechSynthesis.cancel();const n=new SpeechSynthesisUtterance(e);n.rate=t,n.lang="zh-CN";const c=window.speechSynthesis.getVoices().find(u=>u.lang.startsWith("zh"));c&&(n.voice=c),window.speechSynthesis.speak(n);const h=t<=.7?"慢速":t<=1?"正常":t<=1.3?"快速":"极快";return{success:!0,data:`【文字转语音】

正在朗读...
文本长度: ${e.length} 字
语速: ${h}

提示: 语音正在播放中，如需停止请刷新页面。`}}catch(e){return{success:!1,error:e.message}}}async function $(o){try{const e=o.signerName,t=o.color||"#000000",n=o.fontStyle||"cursive";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入签名者姓名"};const s=document.createElement("canvas");s.width=400,s.height=200;const c=s.getContext("2d");c.clearRect(0,0,s.width,s.height);const u={cursive:"cursive",serif:"serif",fantasy:"fantasy"}[n]||"cursive";c.font=`bold 72px ${u}`,c.fillStyle=t,c.textAlign="center",c.textBaseline="middle",c.fillText(e,s.width/2,s.height/2);const i=await new Promise((f,d)=>{s.toBlob(r=>r?f(r):d(new Error("签名生成失败")),"image/png")}),l=URL.createObjectURL(i);return{success:!0,data:{签名者:e,字体风格:n==="cursive"?"手写体":n==="serif"?"楷体":"艺术体",笔迹颜色:t,图片尺寸:`${s.width} x ${s.height} px`,文件大小:`${(i.size/1024).toFixed(1)} KB`,提示:"签名图片为透明背景PNG，可直接用于文档签署"},downloadUrl:l,filename:`signature-${e}.png`}}catch(e){return{success:!1,error:e.message}}}export{$ as eSignature,b as speechToText,y as textSummary,x as textToSpeech,S as textTranslate};
