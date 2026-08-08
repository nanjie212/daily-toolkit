function E(l){return new Promise((o,n)=>{const c=new Image;c.onload=()=>{URL.revokeObjectURL(c.src),o(c)},c.onerror=()=>{URL.revokeObjectURL(c.src),n(new Error("图片加载失败"))},c.src=URL.createObjectURL(l)})}async function P(l){try{const o=l.file,n=Number(l.quality??.7),c=l.format||"image/jpeg";if(!o)return{success:!1,error:"请选择图片文件"};const w=await E(o),d=document.createElement("canvas");d.width=w.naturalWidth,d.height=w.naturalHeight,d.getContext("2d").drawImage(w,0,0);const s=await new Promise((g,i)=>{d.toBlob(p=>p?g(p):i(new Error("压缩失败")),c,Math.max(.1,Math.min(1,n)))}),e=c==="image/png"?"png":c==="image/webp"?"webp":"jpg",r=URL.createObjectURL(s),a=(o.size/1024).toFixed(1),t=(s.size/1024).toFixed(1),f=((1-s.size/o.size)*100).toFixed(1);return{success:!0,data:{原始大小:`${a} KB`,压缩后大小:`${t} KB`,压缩率:`${f}%`,图片尺寸:`${w.naturalWidth} x ${w.naturalHeight}`},downloadUrl:r,filename:`compressed.${e}`}}catch(o){return{success:!1,error:o.message}}}async function T(l){try{const o=l.file,n=l.targetFormat||"image/webp";if(!o)return{success:!1,error:"请选择图片文件"};const c=await E(o),w=document.createElement("canvas");w.width=c.naturalWidth,w.height=c.naturalHeight,w.getContext("2d").drawImage(c,0,0);const h=await new Promise((r,a)=>{w.toBlob(t=>t?r(t):a(new Error("转换失败")),n,.92)}),s=n==="image/png"?"png":n==="image/webp"?"webp":"jpg",e=URL.createObjectURL(h);return{success:!0,data:{原始格式:o.type,目标格式:n,文件大小:`${(h.size/1024).toFixed(1)} KB`,图片尺寸:`${c.naturalWidth} x ${c.naturalHeight}`},downloadUrl:e,filename:`converted.${s}`}}catch(o){return{success:!1,error:o.message}}}async function D(l){try{const o=l.file;let n=Number(l.width),c=Number(l.height);const w=l.keepRatio!==!1;if(!o)return{success:!1,error:"请选择图片文件"};if(!n&&!c)return{success:!1,error:"请输入目标宽度或高度"};const d=await E(o),h=d.naturalWidth,s=d.naturalHeight;if(w)if(n&&!c)c=Math.round(n/h*s);else if(c&&!n)n=Math.round(c/s*h);else{const f=Math.min(n/h,c/s);n=Math.round(h*f),c=Math.round(s*f)}n=n||h,c=c||s;const e=document.createElement("canvas");e.width=n,e.height=c,e.getContext("2d").drawImage(d,0,0,n,c);const a=await new Promise((f,g)=>{e.toBlob(i=>i?f(i):g(new Error("缩放失败")),"image/png")}),t=URL.createObjectURL(a);return{success:!0,data:{原始尺寸:`${h} x ${s}`,新尺寸:`${n} x ${c}`,文件大小:`${(a.size/1024).toFixed(1)} KB`},downloadUrl:t,filename:"resized.png"}}catch(o){return{success:!1,error:o.message}}}async function j(l){try{const o=l.file,n=l.bgColor||"blue",c=l.size||"1inch";if(!o)return{success:!1,error:"请选择图片文件"};const w=await E(o),d={"1inch":[295,413],"2inch":[413,579],small1inch:[260,378]},[h,s]=d[c]||d["1inch"],e=h/s,r={blue:"#438EDB",red:"#FF0000",white:"#FFFFFF"},a=r[n]||r.blue;let t=w.naturalWidth,f=w.naturalHeight;t/f>e?t=Math.round(f*e):f=Math.round(t/e);const i=Math.round((w.naturalWidth-t)/2),p=Math.round((w.naturalHeight-f)/2),x=document.createElement("canvas");x.width=h,x.height=s;const m=x.getContext("2d");m.fillStyle=a,m.fillRect(0,0,h,s),m.drawImage(w,i,p,t,f,0,0,h,s);const $=m.getImageData(0,0,h,s),b=$.data,z=[[0,0],[h-1,0],[0,s-1],[h-1,s-1]];let u=0,y=0,R=0;for(const[M,F]of z){const k=(F*h+M)*4;u+=b[k],y+=b[k+1],R+=b[k+2]}u=Math.round(u/4),y=Math.round(y/4),R=Math.round(R/4);const B=parseInt(a.slice(1,3),16),H=parseInt(a.slice(3,5),16),I=parseInt(a.slice(5,7),16),C=35;for(let M=0;M<b.length;M+=4){const F=Math.abs(b[M]-u),k=Math.abs(b[M+1]-y),Y=Math.abs(b[M+2]-R),X=Math.sqrt(F*F+k*k+Y*Y);if(X<C){const U=Math.min(1,X/C);b[M]=Math.round(b[M]*U+B*(1-U)),b[M+1]=Math.round(b[M+1]*U+H*(1-U)),b[M+2]=Math.round(b[M+2]*U+I*(1-U))}}m.putImageData($,0,0);const v=await new Promise((M,F)=>{x.toBlob(k=>k?M(k):F(new Error("证件照生成失败")),"image/jpeg",.95)}),W=URL.createObjectURL(v);return{success:!0,data:{尺寸:c==="1inch"?"1寸":c==="2inch"?"2寸":"小1寸",背景色:n==="blue"?"蓝色":n==="red"?"红色":"白色",像素尺寸:`${h} x ${s} px`,文件大小:`${(v.size/1024).toFixed(1)} KB`},downloadUrl:W,filename:`id-photo-${c}.jpg`}}catch(o){return{success:!1,error:o.message}}}async function A(l){try{const o=l.file,n=l.text,c=l.position||"bottom-right",w=Number(l.opacity??.3),d=l.color||"#ffffff";if(!o)return{success:!1,error:"请选择图片文件"};if(!n)return{success:!1,error:"请输入水印文字"};const h=await E(o),s=document.createElement("canvas");s.width=h.naturalWidth,s.height=h.naturalHeight;const e=s.getContext("2d");e.drawImage(h,0,0);const r=Math.max(16,Math.round(h.naturalWidth*.03));e.font=`${r}px sans-serif`,e.fillStyle=d,e.globalAlpha=Math.max(.05,Math.min(1,w));const a=r;if(c==="tile"){const i=e.measureText(n).width+r*2,p=r*3;e.save(),e.translate(s.width/2,s.height/2),e.rotate(-Math.PI/6);for(let x=-s.height;x<s.height;x+=p)for(let m=-s.width;m<s.width;m+=i)e.fillText(n,m,x);e.restore()}else{const i=e.measureText(n).width;let p,x;switch(c){case"top-left":p=a,x=a+r;break;case"top-right":p=s.width-i-a,x=a+r;break;case"center":p=(s.width-i)/2,x=s.height/2+r/3;break;case"bottom-left":p=a,x=s.height-a;break;case"bottom-right":default:p=s.width-i-a,x=s.height-a;break}e.fillText(n,p,x)}e.globalAlpha=1;const t=await new Promise((g,i)=>{s.toBlob(p=>p?g(p):i(new Error("水印添加失败")),"image/png")}),f=URL.createObjectURL(t);return{success:!0,data:{水印文字:n,位置:c==="tile"?"平铺":c,透明度:w,颜色:d,图片尺寸:`${h.naturalWidth} x ${h.naturalHeight}`,文件大小:`${(t.size/1024).toFixed(1)} KB`},downloadUrl:f,filename:"watermarked.png"}}catch(o){return{success:!1,error:o.message}}}async function S(l){try{const o=l.file,n=l.mode||"auto-light",c=Math.max(1,Math.min(10,Number(l.strength??5)));if(!o)return{success:!1,error:"请选择图片文件"};const w=await E(o),d=document.createElement("canvas");d.width=w.naturalWidth,d.height=w.naturalHeight;const h=d.getContext("2d");h.drawImage(w,0,0);const s=h.getImageData(0,0,d.width,d.height),e=s.data,r=d.width,a=d.height,t=r*a,f=new Float32Array(t);for(let m=0;m<t;m++){const $=m*4;f[m]=e[$]*.299+e[$+1]*.587+e[$+2]*.114}const g=Math.max(3,Math.round(Math.min(r,a)*.005*c));if(n==="edge-clean"){const m=Math.round(Math.min(r,a)*.05*(c/5));for(let $=0;$<a;$++)for(let b=0;b<r;b++)if(b<m||b>=r-m||$<m||$>=a-m){const u=($*r+b)*4;let y=0,R=0,B=0,H=0;for(let I=-2;I<=2;I++)for(let C=-2;C<=2;C++){const v=b+C,W=$+I;if(v>=0&&v<r&&W>=0&&W<a){const L=(W*r+v)*4;y+=e[L],R+=e[L+1],B+=e[L+2],H++}}e[u]=Math.round(y/H),e[u+1]=Math.round(R/H),e[u+2]=Math.round(B/H)}}else{const m=n==="auto-light",$=new Float32Array(t);for(let u=0;u<a;u++)for(let y=0;y<r;y++){let R=0,B=0;const H=g;for(let I=-H;I<=H;I++)for(let C=-H;C<=H;C++){const v=y+C,W=u+I;v>=0&&v<r&&W>=0&&W<a&&(R+=f[W*r+v],B++)}$[u*r+y]=R/B}const b=(11-c)*8,z=new Uint8Array(t);for(let u=0;u<t;u++){const y=f[u]-$[u];m&&y>b&&(z[u]=1),!m&&y<-b&&(z[u]=1)}for(let u=0;u<2;u++){const y=new Uint8Array(z);for(let R=1;R<a-1;R++)for(let B=1;B<r-1;B++){const H=R*r+B;if(z[H])continue;let I=0,C=0;for(let v=-1;v<=1;v++)for(let W=-1;W<=1;W++)W===0&&v===0||(I++,z[(R+v)*r+(B+W)]&&C++);C>I*.5&&(y[H]=1)}z.set(y)}for(let u=0;u<a;u++)for(let y=0;y<r;y++){const R=u*r+y;if(!z[R])continue;const B=R*4;let H=0,I=0,C=0,v=0;const W=Math.max(g,5);for(let L=-W;L<=W;L+=2)for(let M=-W;M<=W;M+=2){const F=y+M,k=u+L;if(F>=0&&F<r&&k>=0&&k<a&&!z[k*r+F]){const Y=(k*r+F)*4,U=1/(1+Math.sqrt(M*M+L*L));H+=e[Y]*U,I+=e[Y+1]*U,C+=e[Y+2]*U,v+=U}}v>0&&(e[B]=Math.round(H/v),e[B+1]=Math.round(I/v),e[B+2]=Math.round(C/v))}for(let u=0;u<a;u++)for(let y=0;y<r;y++){const R=u*r+y;if(!z[R])continue;const B=R*4;let H=0,I=0,C=0,v=0;for(let W=-1;W<=1;W++)for(let L=-1;L<=1;L++){const M=y+L,F=u+W;if(M>=0&&M<r&&F>=0&&F<a){const k=(F*r+M)*4;H+=e[k],I+=e[k+1],C+=e[k+2],v++}}e[B]=Math.round(H/v),e[B+1]=Math.round(I/v),e[B+2]=Math.round(C/v)}}h.putImageData(s,0,0);const i=await new Promise((m,$)=>{d.toBlob(b=>b?m(b):$(new Error("去水印处理失败")),"image/png")}),p=URL.createObjectURL(i);return{success:!0,data:{处理模式:n==="auto-light"?"自动检测(浅色水印)":n==="auto-dark"?"自动检测(深色水印)":"边缘区域清除",强度:c,图片尺寸:`${w.naturalWidth} x ${w.naturalHeight}`,文件大小:`${(i.size/1024).toFixed(1)} KB`},downloadUrl:p,filename:"watermark-removed.png"}}catch(o){return{success:!1,error:o.message}}}async function O(l){try{const o=l.files,n=l.direction||"vertical",c=Number(l.gap??0);if(!o)return{success:!1,error:"请选择图片文件"};const w=Array.isArray(o)?o:[o];if(w.length===0)return{success:!1,error:"请选择至少一张图片"};const d=await Promise.all(w.map(t=>E(t)));if(d.length===1){const t=document.createElement("canvas");t.width=d[0].naturalWidth,t.height=d[0].naturalHeight,t.getContext("2d").drawImage(d[0],0,0);const g=await new Promise((p,x)=>{t.toBlob(m=>m?p(m):x(new Error("处理失败")),"image/png")}),i=URL.createObjectURL(g);return{success:!0,data:{拼接方向:n==="vertical"?"纵向":"横向",图片数量:1,图片尺寸:`${t.width} x ${t.height}`,文件大小:`${(g.size/1024).toFixed(1)} KB`,提示:"仅选择了一张图片，请按住Ctrl/Cmd多选图片以实现拼接"},downloadUrl:i,filename:"stitched.png"}}const h=document.createElement("canvas"),s=h.getContext("2d");if(n==="vertical"){const t=Math.max(...d.map(i=>i.naturalWidth)),f=d.reduce((i,p)=>{const x=t/p.naturalWidth;return i+Math.round(p.naturalHeight*x)},0)+c*(d.length-1);h.width=t,h.height=f;let g=0;for(const i of d){const p=t/i.naturalWidth,x=Math.round(i.naturalHeight*p);s.drawImage(i,0,g,t,x),g+=x+c}}else{const t=Math.max(...d.map(i=>i.naturalHeight)),f=d.reduce((i,p)=>{const x=t/p.naturalHeight;return i+Math.round(p.naturalWidth*x)},0)+c*(d.length-1);h.width=f,h.height=t;let g=0;for(const i of d){const p=t/i.naturalHeight,x=Math.round(i.naturalWidth*p);s.drawImage(i,g,0,x,t),g+=x+c}}const e=await new Promise((t,f)=>{h.toBlob(g=>g?t(g):f(new Error("拼接处理失败")),"image/png")}),r=URL.createObjectURL(e);return{success:!0,data:{拼接方向:n==="vertical"?"纵向":"横向",图片数量:d.length,图片尺寸:`${h.width} x ${h.height}`,文件大小:`${(e.size/1024).toFixed(1)} KB`},downloadUrl:r,filename:"stitched.png"}}catch(o){return{success:!1,error:o.message}}}async function N(l){try{const o=l.files,n=l.orientation||"auto",c=l.pageSize||"a4";if(!o)return{success:!1,error:"请选择图片文件"};const w=Array.isArray(o)?o:[o];if(w.length===0)return{success:!1,error:"请选择至少一张图片"};const d={a4:{width:595.28,height:841.89},letter:{width:612,height:792}},h=d[c]||d.a4,s=[];for(const t of w)s.push(await E(t));const e=document.createElement("canvas");if(w.length===1){const t=s[0],f=t.naturalWidth>t.naturalHeight;(n==="auto"?f:n==="landscape")?(e.width=h.height,e.height=h.width):(e.width=h.width,e.height=h.height);const i=e.getContext("2d");if(t.naturalWidth===0||t.naturalHeight===0)return{success:!1,error:"图片加载失败，请检查文件格式"};i.fillStyle="#FFFFFF",i.fillRect(0,0,e.width,e.height);const p=20,x=e.width-p*2,m=e.height-p*2,$=Math.min(x/t.naturalWidth,m/t.naturalHeight),b=t.naturalWidth*$,z=t.naturalHeight*$,u=(e.width-b)/2,y=(e.height-z)/2;i.drawImage(t,u,y,b,z)}else{const t=Math.max(...s.map(p=>p.naturalWidth)),f=s.reduce((p,x)=>{const m=t/x.naturalWidth;return p+x.naturalHeight*m},0);e.width=t,e.height=f;const g=e.getContext("2d");g.fillStyle="#FFFFFF",g.fillRect(0,0,e.width,e.height);let i=0;for(const p of s){const x=t/p.naturalWidth,m=p.naturalHeight*x;g.drawImage(p,0,i,t,m),i+=m}}const r=await new Promise((t,f)=>{e.toBlob(g=>g?t(g):f(new Error("转换失败")),"image/png")}),a=URL.createObjectURL(r);return{success:!0,data:{图片数量:w.length,页面大小:c.toUpperCase(),页面方向:n==="landscape"?"横向":n==="portrait"?"纵向":"自动",输出尺寸:`${e.width} x ${e.height} px`,文件大小:`${(r.size/1024).toFixed(1)} KB`,提示:"已生成图片格式，如需真正的PDF请使用浏览器打印功能(Ctrl+P)另存为PDF"},downloadUrl:a,filename:"images-to-pdf.png"}}catch(o){return{success:!1,error:o.message}}}async function K(l){try{const o=l.file,n=l.annotationType||"arrow-red",c=Number(l.startX??20)/100,w=Number(l.startY??30)/100,d=Number(l.endX??70)/100,h=Number(l.endY??60)/100,s=l.text||"";if(!o)return{success:!1,error:"请选择图片文件"};const e=await E(o),r=document.createElement("canvas");r.width=e.naturalWidth,r.height=e.naturalHeight;const a=r.getContext("2d");a.drawImage(e,0,0);const t=c*r.width,f=w*r.height,g=d*r.width,i=h*r.height,p=n.includes("red"),x=p?"#FF0000":"#00CC00",m=Math.max(3,Math.round(Math.min(r.width,r.height)*.005));if(n.startsWith("arrow")){a.strokeStyle=x,a.lineWidth=m,a.lineCap="round",a.beginPath(),a.moveTo(t,f),a.lineTo(g,i),a.stroke();const u=Math.atan2(i-f,g-t),y=m*8;a.beginPath(),a.moveTo(g,i),a.lineTo(g-y*Math.cos(u-Math.PI/6),i-y*Math.sin(u-Math.PI/6)),a.moveTo(g,i),a.lineTo(g-y*Math.cos(u+Math.PI/6),i-y*Math.sin(u+Math.PI/6)),a.stroke()}else if(n.startsWith("rect"))a.strokeStyle=x,a.lineWidth=m,a.strokeRect(t,f,g-t,i-f);else if(n==="text"&&s){const u=Math.max(16,Math.round(Math.min(r.width,r.height)*.03));a.font=`bold ${u}px sans-serif`,a.fillStyle=x;const y=u*.3,R=a.measureText(s);a.fillStyle="rgba(0,0,0,0.6)",a.fillRect(g-y,i-u-y,R.width+y*2,u+y*2),a.fillStyle="#FFFFFF",a.fillText(s,g,i)}const $=await new Promise((u,y)=>{r.toBlob(R=>R?u(R):y(new Error("标注失败")),"image/png")}),b=URL.createObjectURL($);return{success:!0,data:{标注类型:n.startsWith("arrow")?"箭头":n.startsWith("rect")?"框选":"文字",标注颜色:p?"红色":"绿色",图片尺寸:`${r.width} x ${r.height}`,文件大小:`${($.size/1024).toFixed(1)} KB`},downloadUrl:b,filename:"annotated.png"}}catch(o){return{success:!1,error:o.message}}}async function q(l){try{const o=l.file;if(!o)return{success:!1,error:"请上传图片"};const n=new FileReader;return await new Promise((w,d)=>{n.onload=()=>w(),n.onerror=()=>d(new Error("图片读取失败")),n.readAsDataURL(o)}),{success:!0,type:"html",data:`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>图片裁剪</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#1a1a2e;color:#fff;min-height:100vh;display:flex;flex-direction:column}
.header{display:flex;align-items:center;padding:12px 16px;background:rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.08)}
.header h1{font-size:16px;font-weight:600}
.crop-container{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;position:relative;overflow:hidden}
.crop-wrapper{position:relative;display:inline-block;max-width:100%;max-height:calc(100vh - 200px)}
.crop-wrapper img{display:block;max-width:100%;max-height:calc(100vh - 200px);user-select:none;-webkit-user-drag:none}
.crop-overlay{position:absolute;top:0;left:0;width:100%;height:100%;cursor:crosshair}
.crop-box{position:absolute;border:2px dashed #fff;box-shadow:0 0 0 9999px rgba(0,0,0,0.5);cursor:move;display:none}
.crop-box.active{display:block}
.resize-handle{position:absolute;width:12px;height:12px;background:#007aff;border:2px solid #fff;border-radius:50%;z-index:10}
.resize-handle.tl{top:-6px;left:-6px;cursor:nw-resize}
.resize-handle.tr{top:-6px;right:-6px;cursor:ne-resize}
.resize-handle.bl{bottom:-6px;left:-6px;cursor:sw-resize}
.resize-handle.br{bottom:-6px;right:-6px;cursor:se-resize}
.crop-info{position:absolute;bottom:-28px;left:0;font-size:12px;color:#8e8e93;white-space:nowrap}
.toolbar{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px;background:rgba(255,255,255,0.05);border-top:1px solid rgba(255,255,255,0.08)}
.aspect-group{display:flex;gap:4px}
.aspect-btn{padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#8e8e93;font-size:13px;cursor:pointer;transition:all .2s}
.aspect-btn.active{background:#007aff;color:#fff;border-color:#007aff}
.btn{padding:10px 24px;border-radius:10px;border:none;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.btn-crop{background:#007aff;color:#fff}
.btn-crop:hover{background:#0056cc}
.btn-reset{background:rgba(255,255,255,0.1);color:#8e8e93}
.btn-reset:hover{background:rgba(255,255,255,0.15);color:#fff}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.result-container{display:none;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:16px}
.result-container.active{display:flex}
.result-container img{max-width:100%;max-height:60vh;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.3)}
.result-info{text-align:center;font-size:13px;color:#8e8e93}
.btn-group{display:flex;gap:12px}
.btn-download{background:#34c759;color:#fff}
.btn-download:hover{background:#28a745}
.btn-back{background:rgba(255,255,255,0.1);color:#8e8e93}
.btn-back:hover{background:rgba(255,255,255,0.15);color:#fff}
</style>
</head>
<body>
<div class="header">
  <h1>🖼️ 图片裁剪</h1>
</div>

<div class="crop-container" id="cropContainer">
  <div class="crop-wrapper" id="cropWrapper">
    <img id="sourceImage" src="\${dataUrl}" alt="原图">
    <div class="crop-overlay" id="cropOverlay"></div>
    <div class="crop-box" id="cropBox">
      <div class="resize-handle tl" data-dir="tl"></div>
      <div class="resize-handle tr" data-dir="tr"></div>
      <div class="resize-handle bl" data-dir="bl"></div>
      <div class="resize-handle br" data-dir="br"></div>
      <div class="crop-info" id="cropInfo"></div>
    </div>
  </div>
</div>

<div class="result-container" id="resultContainer">
  <img id="resultImage" alt="裁剪结果">
  <div class="result-info" id="resultInfo"></div>
  <div class="btn-group">
    <button class="btn btn-back" onclick="backToCrop()">返回重新裁剪</button>
    <button class="btn btn-download" id="downloadBtn">下载裁剪图片</button>
  </div>
</div>

<div class="toolbar">
  <div class="aspect-group">
    <button class="aspect-btn active" data-ratio="free">自由</button>
    <button class="aspect-btn" data-ratio="1:1">1:1</button>
    <button class="aspect-btn" data-ratio="4:3">4:3</button>
    <button class="aspect-btn" data-ratio="16:9">16:9</button>
    <button class="aspect-btn" data-ratio="3:4">3:4</button>
    <button class="aspect-btn" data-ratio="9:16">9:16</button>
  </div>
  <button class="btn btn-reset" onclick="resetCrop()">重置</button>
  <button class="btn btn-crop" id="cropBtn" onclick="doCrop()">✂️ 裁剪</button>
</div>

<script>
const img = document.getElementById('sourceImage');
const overlay = document.getElementById('cropOverlay');
const cropBox = document.getElementById('cropBox');
const cropInfo = document.getElementById('cropInfo');
const cropBtn = document.getElementById('cropBtn');
const cropContainer = document.getElementById('cropContainer');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const resultInfo = document.getElementById('resultInfo');
const downloadBtn = document.getElementById('downloadBtn');

let isDragging = false;
let isResizing = false;
let isMoving = false;
let startX, startY, startW, startH;
let currentDir = '';
let aspectRatio = 0;
let cropRect = null;

img.onload = function() {
  const wrapper = document.getElementById('cropWrapper');
  const rect = wrapper.getBoundingClientRect();
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const displayW = img.width;
  const displayH = img.height;
  const scaleX = naturalW / displayW;
  const scaleY = naturalH / displayH;

  // 默认裁剪区域：居中 70%
  const defaultW = displayW * 0.7;
  const defaultH = displayH * 0.7;
  const defaultX = (displayW - defaultW) / 2;
  const defaultY = (displayH - defaultH) / 2;
  showCrop(defaultX, defaultY, defaultW, defaultH);
  updateCropInfo(defaultX, defaultY, defaultW, defaultH, scaleX, scaleY);

  overlay.onmousedown = function(e) {
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (mx >= cropRect.x && mx <= cropRect.x + cropRect.w && my >= cropRect.y && my <= cropRect.y + cropRect.h) {
      isMoving = true;
      startX = e.clientX;
      startY = e.clientY;
      return;
    }
    isDragging = true;
    cropRect = { x: mx, y: my, w: 0, h: 0 };
    cropBox.className = 'crop-box active';
    startX = mx;
    startY = my;
  };

  document.onmousemove = function(e) {
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDragging) {
      let nx = Math.min(startX, mx);
      let ny = Math.min(startY, my);
      let nw = Math.abs(mx - startX);
      let nh = Math.abs(my - startY);
      if (aspectRatio > 0) {
        nh = nw / aspectRatio;
        if (ny + nh > displayH) { nh = displayH - ny; nw = nh * aspectRatio; }
      }
      cropRect = { x: nx, y: ny, w: Math.min(nw, displayW - nx), h: Math.min(nh, displayH - ny) };
      cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
    } else if (isResizing) {
      let nx = cropRect.x, ny = cropRect.y, nw = cropRect.w, nh = cropRect.h;
      const dx = mx - (cropRect.x + cropRect.w);
      const dy = my - (cropRect.y + cropRect.h);
      if (currentDir.includes('r')) { nw = Math.max(20, startW + dx); if (aspectRatio > 0) nh = nw / aspectRatio; }
      if (currentDir.includes('b')) { nh = Math.max(20, startH + dy); if (aspectRatio > 0) nw = nh * aspectRatio; }
      if (currentDir.includes('l')) { const right = cropRect.x + cropRect.w; nx = right - nw; }
      if (currentDir.includes('t')) { const bottom = cropRect.y + cropRect.h; ny = bottom - nh; }
      if (nx < 0) { nx = 0; nw = Math.min(nw, cropRect.x + cropRect.w); }
      if (ny < 0) { ny = 0; nh = Math.min(nh, cropRect.y + cropRect.h); }
      if (nx + nw > displayW) { nw = displayW - nx; if (aspectRatio > 0) nh = nw / aspectRatio; }
      if (ny + nh > displayH) { nh = displayH - ny; if (aspectRatio > 0) nw = nh * aspectRatio; }
      cropRect = { x: nx, y: ny, w: Math.max(20, nw), h: Math.max(20, nh) };
      cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
    } else if (isMoving) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let nx = cropRect.x + dx, ny = cropRect.y + dy;
      if (nx < 0) nx = 0; if (ny < 0) ny = 0;
      if (nx + cropRect.w > displayW) nx = displayW - cropRect.w;
      if (ny + cropRect.h > displayH) ny = displayH - cropRect.h;
      cropRect = { ...cropRect, x: nx, y: ny };
      cropBox.style.cssText = \`left:\${nx}px;top:\${ny}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(nx, ny, cropRect.w, cropRect.h, scaleX, scaleY);
      startX = e.clientX;
      startY = e.clientY;
    }
  };

  document.onmouseup = function() {
    isDragging = false; isResizing = false; isMoving = false;
  };

  // Touch support
  overlay.ontouchstart = function(e) {
    const touch = e.touches[0];
    const rect = wrapper.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
    if (mx >= cropRect.x && mx <= cropRect.x + cropRect.w && my >= cropRect.y && my <= cropRect.y + cropRect.h) {
      isMoving = true;
      startX = touch.clientX;
      startY = touch.clientY;
      return;
    }
    isDragging = true;
    cropRect = { x: mx, y: my, w: 0, h: 0 };
    cropBox.className = 'crop-box active';
    startX = mx;
    startY = my;
  };

  document.ontouchmove = function(e) {
    const touch = e.touches[0];
    const rect = wrapper.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
    if (isDragging) {
      let nx = Math.min(startX, mx), ny = Math.min(startY, my);
      let nw = Math.abs(mx - startX), nh = Math.abs(my - startY);
      if (aspectRatio > 0) { nh = nw / aspectRatio; if (ny + nh > displayH) { nh = displayH - ny; nw = nh * aspectRatio; } }
      cropRect = { x: nx, y: ny, w: Math.min(nw, displayW - nx), h: Math.min(nh, displayH - ny) };
      cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
    } else if (isMoving) {
      const dx = touch.clientX - startX, dy = touch.clientY - startY;
      let nx = cropRect.x + dx, ny = cropRect.y + dy;
      if (nx < 0) nx = 0; if (ny < 0) ny = 0;
      if (nx + cropRect.w > displayW) nx = displayW - cropRect.w;
      if (ny + cropRect.h > displayH) ny = displayH - cropRect.h;
      cropRect = { ...cropRect, x: nx, y: ny };
      cropBox.style.cssText = \`left:\${nx}px;top:\${ny}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
      updateCropInfo(nx, ny, cropRect.w, cropRect.h, scaleX, scaleY);
      startX = touch.clientX;
      startY = touch.clientY;
    }
  };

  document.ontouchend = function() { isDragging = false; isMoving = false; };

  // Resize handles
  document.querySelectorAll('.resize-handle').forEach(h => {
    h.onmousedown = function(e) {
      isResizing = true; currentDir = this.dataset.dir;
      startW = cropRect.w; startH = cropRect.h;
      e.stopPropagation(); e.preventDefault();
    };
  });

  // Aspect ratio buttons
  document.querySelectorAll('.aspect-btn').forEach(b => {
    b.onclick = function() {
      document.querySelectorAll('.aspect-btn').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      const ratio = this.dataset.ratio;
      if (ratio === 'free') { aspectRatio = 0; return; }
      const parts = ratio.split(':').map(Number);
      aspectRatio = parts[0] / parts[1];
      if (cropRect) {
        let nh = cropRect.w / aspectRatio;
        if (cropRect.y + nh > displayH) { nh = displayH - cropRect.y; }
        cropRect.h = nh;
        cropBox.style.cssText = \`left:\${cropRect.x}px;top:\${cropRect.y}px;width:\${cropRect.w}px;height:\${cropRect.h}px\`;
        updateCropInfo(cropRect.x, cropRect.y, cropRect.w, cropRect.h, scaleX, scaleY);
      }
    };
  });
};

function showCrop(x, y, w, h) {
  cropRect = { x, y, w, h };
  cropBox.className = 'crop-box active';
  cropBox.style.cssText = \`left:\${x}px;top:\${y}px;width:\${w}px;height:\${h}px\`;
}

function updateCropInfo(x, y, w, h, sx, sy) {
  const nw = Math.round(w * sx), nh = Math.round(h * sy);
  cropInfo.textContent = \`\${nw} × \${nh}px  位置(\${Math.round(x * sx)}, \${Math.round(y * sy)})\`;
}

function resetCrop() {
  const displayW = img.width, displayH = img.height;
  const dw = displayW * 0.7, dh = displayH * 0.7;
  showCrop((displayW - dw) / 2, (displayH - dh) / 2, dw, dh);
}

function doCrop() {
  if (!cropRect || cropRect.w < 5 || cropRect.h < 5) return;
  cropBtn.disabled = true; cropBtn.textContent = '⏳ 裁剪中...';

  const canvas = document.createElement('canvas');
  const naturalW = img.naturalWidth, naturalH = img.naturalHeight;
  const displayW = img.width, displayH = img.height;
  const sx = naturalW / displayW, sy = naturalH / displayH;
  const nx = Math.round(cropRect.x * sx), ny = Math.round(cropRect.y * sy);
  const nw = Math.round(cropRect.w * sx), nh = Math.round(cropRect.h * sy);

  canvas.width = nw; canvas.height = nh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, nx, ny, nw, nh, 0, 0, nw, nh);

  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    resultImage.src = url;
    resultInfo.innerHTML = \`裁剪完成：\${nw} × \${nh}px  |  大小：\${(blob.size / 1024).toFixed(1)} KB\`;
    downloadBtn.onclick = function() {
      const a = document.createElement('a');
      a.href = url; a.download = 'cropped_\${nw}x\${nh}.png'; a.click();
    };
    cropContainer.style.display = 'none';
    resultContainer.classList.add('active');
    cropBtn.disabled = false; cropBtn.textContent = '✂️ 裁剪';
  }, 'image/png', 0.92);
}

function backToCrop() {
  cropContainer.style.display = 'flex';
  resultContainer.classList.remove('active');
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) doCrop();
  if (e.key === 'r' || e.key === 'R') resetCrop();
});
<\/script>
</body>
</html>`}}catch(o){return{success:!1,error:`裁剪失败: ${o.message}`}}}async function G(l){try{const o=l.files;let n=[];if(Array.isArray(o)?n=o:o instanceof File&&(n=[o]),n.length<2)return{success:!1,error:"请至少上传2个PDF文件"};for(const t of n)if(!t.name.toLowerCase().endsWith(".pdf"))return{success:!1,error:`${t.name} 不是PDF文件`};const c=[];for(const t of n){const f=await t.arrayBuffer();c.push(new Uint8Array(f))}const d=[c[0]];for(let t=1;t<c.length;t++){const f=c[t],g=new TextEncoder().encode("%%EOF");let i=-1;for(let p=f.length-10;p>=0;p--){let x=!0;for(let m=0;m<g.length;m++)if(f[p+m]!==g[m]){x=!1;break}if(x){i=p;break}}i>=0?d.push(f.slice(0,i)):d.push(f)}const h=d.reduce((t,f)=>t+f.length,0),s=new Uint8Array(h);let e=0;for(const t of d)s.set(t,e),e+=t.length;const r=new Blob([s],{type:"application/pdf"}),a=URL.createObjectURL(r);return{success:!0,data:{合并文件数:`${n.length} 个`,文件列表:n.map(t=>t.name).join("、"),合并后大小:`${(r.size/1024/1024).toFixed(2)} MB`,提示:"PDF合并为简单拼接方式，复杂PDF建议使用专业工具"},downloadUrl:a,filename:"merged.pdf"}}catch(o){return{success:!1,error:`合并失败: ${o.message}`}}}async function _(l){switch(l.mode||"compress"){case"convert":return T(l);case"resize":return D(l);default:return P(l)}}export{j as idPhoto,P as imageCompress,T as imageConvert,q as imageCrop,_ as imageProcessor,D as imageResize,O as imageStitch,N as imageToPdf,A as imageWatermark,S as imageWatermarkRemove,G as pdfMerge,K as screenshotAnnotate};
