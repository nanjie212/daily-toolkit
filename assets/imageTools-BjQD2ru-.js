const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jszip.min-DqMG4rCX.js","assets/vendor-CR0zKoQR.js","assets/jszip-BONsw4OH.js"])))=>i.map(i=>d[i]);
import{_ as P}from"./index-D64k3F7C.js";import"./vendor-CR0zKoQR.js";import"./lucide-B6ZXsKn3.js";import"./qrcode-DpynCwP9.js";function E(d){return new Promise((o,n)=>{const l=new Image;l.onload=()=>{URL.revokeObjectURL(l.src),o(l)},l.onerror=()=>{URL.revokeObjectURL(l.src),n(new Error("图片加载失败"))},l.src=URL.createObjectURL(d)})}async function T(d){try{const o=d.file,n=Number(d.quality??.7),l=d.format||"image/jpeg";if(!o)return{success:!1,error:"请选择图片文件"};const y=await E(o),h=document.createElement("canvas");h.width=y.naturalWidth,h.height=y.naturalHeight,h.getContext("2d").drawImage(y,0,0);const s=await new Promise((i,c)=>{h.toBlob(u=>u?i(u):c(new Error("压缩失败")),l,Math.max(.1,Math.min(1,n)))}),t=l==="image/png"?"png":l==="image/webp"?"webp":"jpg",r=URL.createObjectURL(s),a=(o.size/1024).toFixed(1),e=(s.size/1024).toFixed(1),w=((1-s.size/o.size)*100).toFixed(1);return{success:!0,data:{原始大小:`${a} KB`,压缩后大小:`${e} KB`,压缩率:`${w}%`,图片尺寸:`${y.naturalWidth} x ${y.naturalHeight}`},downloadUrl:r,filename:`compressed.${t}`}}catch(o){return{success:!1,error:o.message}}}async function D(d){try{const o=d.file,n=d.targetFormat||"image/webp";if(!o)return{success:!1,error:"请选择图片文件"};const l=await E(o),y=document.createElement("canvas");y.width=l.naturalWidth,y.height=l.naturalHeight,y.getContext("2d").drawImage(l,0,0);const p=await new Promise((r,a)=>{y.toBlob(e=>e?r(e):a(new Error("转换失败")),n,.92)}),s=n==="image/png"?"png":n==="image/webp"?"webp":"jpg",t=URL.createObjectURL(p);return{success:!0,data:{原始格式:o.type,目标格式:n,文件大小:`${(p.size/1024).toFixed(1)} KB`,图片尺寸:`${l.naturalWidth} x ${l.naturalHeight}`},downloadUrl:t,filename:`converted.${s}`}}catch(o){return{success:!1,error:o.message}}}async function j(d){try{const o=d.file;let n=Number(d.width),l=Number(d.height);const y=d.keepRatio!==!1;if(!o)return{success:!1,error:"请选择图片文件"};if(!n&&!l)return{success:!1,error:"请输入目标宽度或高度"};const h=await E(o),p=h.naturalWidth,s=h.naturalHeight;if(y)if(n&&!l)l=Math.round(n/p*s);else if(l&&!n)n=Math.round(l/s*p);else{const w=Math.min(n/p,l/s);n=Math.round(p*w),l=Math.round(s*w)}n=n||p,l=l||s;const t=document.createElement("canvas");t.width=n,t.height=l,t.getContext("2d").drawImage(h,0,0,n,l);const a=await new Promise((w,i)=>{t.toBlob(c=>c?w(c):i(new Error("缩放失败")),"image/png")}),e=URL.createObjectURL(a);return{success:!0,data:{原始尺寸:`${p} x ${s}`,新尺寸:`${n} x ${l}`,文件大小:`${(a.size/1024).toFixed(1)} KB`},downloadUrl:e,filename:"resized.png"}}catch(o){return{success:!1,error:o.message}}}async function K(d){try{const o=d.file,n=d.bgColor||"blue",l=d.size||"1inch";if(!o)return{success:!1,error:"请选择图片文件"};const y=await E(o),h={"1inch":[295,413],"2inch":[413,579],small1inch:[260,378]},[p,s]=h[l]||h["1inch"],t=p/s,r={blue:"#438EDB",red:"#FF0000",white:"#FFFFFF"},a=r[n]||r.blue;let e=y.naturalWidth,w=y.naturalHeight;e/w>t?e=Math.round(w*t):w=Math.round(e/t);const c=Math.round((y.naturalWidth-e)/2),u=Math.round((y.naturalHeight-w)/2),g=document.createElement("canvas");g.width=p,g.height=s;const m=g.getContext("2d");m.fillStyle=a,m.fillRect(0,0,p,s),m.drawImage(y,c,u,e,w,0,0,p,s);const R=m.getImageData(0,0,p,s),b=R.data,z=[[0,0],[p-1,0],[0,s-1],[p-1,s-1]];let f=0,x=0,v=0;for(const[$,F]of z){const k=(F*p+$)*4;f+=b[k],x+=b[k+1],v+=b[k+2]}f=Math.round(f/4),x=Math.round(x/4),v=Math.round(v/4);const B=parseInt(a.slice(1,3),16),H=parseInt(a.slice(3,5),16),I=parseInt(a.slice(5,7),16),C=35;for(let $=0;$<b.length;$+=4){const F=Math.abs(b[$]-f),k=Math.abs(b[$+1]-x),Y=Math.abs(b[$+2]-v),X=Math.sqrt(F*F+k*k+Y*Y);if(X<C){const U=Math.min(1,X/C);b[$]=Math.round(b[$]*U+B*(1-U)),b[$+1]=Math.round(b[$+1]*U+H*(1-U)),b[$+2]=Math.round(b[$+2]*U+I*(1-U))}}m.putImageData(R,0,0);const M=await new Promise(($,F)=>{g.toBlob(k=>k?$(k):F(new Error("证件照生成失败")),"image/jpeg",.95)}),W=URL.createObjectURL(M);return{success:!0,data:{尺寸:l==="1inch"?"1寸":l==="2inch"?"2寸":"小1寸",背景色:n==="blue"?"蓝色":n==="red"?"红色":"白色",像素尺寸:`${p} x ${s} px`,文件大小:`${(M.size/1024).toFixed(1)} KB`},downloadUrl:W,filename:`id-photo-${l}.jpg`}}catch(o){return{success:!1,error:o.message}}}async function _(d){try{const o=d.file,n=d.text,l=d.position||"bottom-right",y=Number(d.opacity??.3),h=d.color||"#ffffff";if(!o)return{success:!1,error:"请选择图片文件"};if(!n)return{success:!1,error:"请输入水印文字"};const p=await E(o),s=document.createElement("canvas");s.width=p.naturalWidth,s.height=p.naturalHeight;const t=s.getContext("2d");t.drawImage(p,0,0);const r=Math.max(16,Math.round(p.naturalWidth*.03));t.font=`${r}px sans-serif`,t.fillStyle=h,t.globalAlpha=Math.max(.05,Math.min(1,y));const a=r;if(l==="tile"){const c=t.measureText(n).width+r*2,u=r*3;t.save(),t.translate(s.width/2,s.height/2),t.rotate(-Math.PI/6);for(let g=-s.height;g<s.height;g+=u)for(let m=-s.width;m<s.width;m+=c)t.fillText(n,m,g);t.restore()}else{const c=t.measureText(n).width;let u,g;switch(l){case"top-left":u=a,g=a+r;break;case"top-right":u=s.width-c-a,g=a+r;break;case"center":u=(s.width-c)/2,g=s.height/2+r/3;break;case"bottom-left":u=a,g=s.height-a;break;case"bottom-right":default:u=s.width-c-a,g=s.height-a;break}t.fillText(n,u,g)}t.globalAlpha=1;const e=await new Promise((i,c)=>{s.toBlob(u=>u?i(u):c(new Error("水印添加失败")),"image/png")}),w=URL.createObjectURL(e);return{success:!0,data:{水印文字:n,位置:l==="tile"?"平铺":l,透明度:y,颜色:h,图片尺寸:`${p.naturalWidth} x ${p.naturalHeight}`,文件大小:`${(e.size/1024).toFixed(1)} KB`},downloadUrl:w,filename:"watermarked.png"}}catch(o){return{success:!1,error:o.message}}}async function q(d){try{const o=d.file,n=d.mode||"auto-light",l=Math.max(1,Math.min(10,Number(d.strength??5)));if(!o)return{success:!1,error:"请选择图片文件"};const y=await E(o),h=document.createElement("canvas");h.width=y.naturalWidth,h.height=y.naturalHeight;const p=h.getContext("2d");p.drawImage(y,0,0);const s=p.getImageData(0,0,h.width,h.height),t=s.data,r=h.width,a=h.height,e=r*a,w=new Float32Array(e);for(let m=0;m<e;m++){const R=m*4;w[m]=t[R]*.299+t[R+1]*.587+t[R+2]*.114}const i=Math.max(3,Math.round(Math.min(r,a)*.005*l));if(n==="edge-clean"){const m=Math.round(Math.min(r,a)*.05*(l/5));for(let R=0;R<a;R++)for(let b=0;b<r;b++)if(b<m||b>=r-m||R<m||R>=a-m){const f=(R*r+b)*4;let x=0,v=0,B=0,H=0;for(let I=-2;I<=2;I++)for(let C=-2;C<=2;C++){const M=b+C,W=R+I;if(M>=0&&M<r&&W>=0&&W<a){const L=(W*r+M)*4;x+=t[L],v+=t[L+1],B+=t[L+2],H++}}t[f]=Math.round(x/H),t[f+1]=Math.round(v/H),t[f+2]=Math.round(B/H)}}else{const m=n==="auto-light",R=new Float32Array(e);for(let f=0;f<a;f++)for(let x=0;x<r;x++){let v=0,B=0;const H=i;for(let I=-H;I<=H;I++)for(let C=-H;C<=H;C++){const M=x+C,W=f+I;M>=0&&M<r&&W>=0&&W<a&&(v+=w[W*r+M],B++)}R[f*r+x]=v/B}const b=(11-l)*8,z=new Uint8Array(e);for(let f=0;f<e;f++){const x=w[f]-R[f];m&&x>b&&(z[f]=1),!m&&x<-b&&(z[f]=1)}for(let f=0;f<2;f++){const x=new Uint8Array(z);for(let v=1;v<a-1;v++)for(let B=1;B<r-1;B++){const H=v*r+B;if(z[H])continue;let I=0,C=0;for(let M=-1;M<=1;M++)for(let W=-1;W<=1;W++)W===0&&M===0||(I++,z[(v+M)*r+(B+W)]&&C++);C>I*.5&&(x[H]=1)}z.set(x)}for(let f=0;f<a;f++)for(let x=0;x<r;x++){const v=f*r+x;if(!z[v])continue;const B=v*4;let H=0,I=0,C=0,M=0;const W=Math.max(i,5);for(let L=-W;L<=W;L+=2)for(let $=-W;$<=W;$+=2){const F=x+$,k=f+L;if(F>=0&&F<r&&k>=0&&k<a&&!z[k*r+F]){const Y=(k*r+F)*4,U=1/(1+Math.sqrt($*$+L*L));H+=t[Y]*U,I+=t[Y+1]*U,C+=t[Y+2]*U,M+=U}}M>0&&(t[B]=Math.round(H/M),t[B+1]=Math.round(I/M),t[B+2]=Math.round(C/M))}for(let f=0;f<a;f++)for(let x=0;x<r;x++){const v=f*r+x;if(!z[v])continue;const B=v*4;let H=0,I=0,C=0,M=0;for(let W=-1;W<=1;W++)for(let L=-1;L<=1;L++){const $=x+L,F=f+W;if($>=0&&$<r&&F>=0&&F<a){const k=(F*r+$)*4;H+=t[k],I+=t[k+1],C+=t[k+2],M++}}t[B]=Math.round(H/M),t[B+1]=Math.round(I/M),t[B+2]=Math.round(C/M)}}p.putImageData(s,0,0);const c=await new Promise((m,R)=>{h.toBlob(b=>b?m(b):R(new Error("去水印处理失败")),"image/png")}),u=URL.createObjectURL(c);return{success:!0,data:{处理模式:n==="auto-light"?"自动检测(浅色水印)":n==="auto-dark"?"自动检测(深色水印)":"边缘区域清除",强度:l,图片尺寸:`${y.naturalWidth} x ${y.naturalHeight}`,文件大小:`${(c.size/1024).toFixed(1)} KB`},downloadUrl:u,filename:"watermark-removed.png"}}catch(o){return{success:!1,error:o.message}}}async function G(d){try{const o=d.files,n=d.direction||"vertical",l=Number(d.gap??0);if(!o)return{success:!1,error:"请选择图片文件"};const y=Array.isArray(o)?o:[o];if(y.length===0)return{success:!1,error:"请选择至少一张图片"};const h=await Promise.all(y.map(e=>E(e)));if(h.length===1){const e=document.createElement("canvas");e.width=h[0].naturalWidth,e.height=h[0].naturalHeight,e.getContext("2d").drawImage(h[0],0,0);const i=await new Promise((u,g)=>{e.toBlob(m=>m?u(m):g(new Error("处理失败")),"image/png")}),c=URL.createObjectURL(i);return{success:!0,data:{拼接方向:n==="vertical"?"纵向":"横向",图片数量:1,图片尺寸:`${e.width} x ${e.height}`,文件大小:`${(i.size/1024).toFixed(1)} KB`,提示:"仅选择了一张图片，请按住Ctrl/Cmd多选图片以实现拼接"},downloadUrl:c,filename:"stitched.png"}}const p=document.createElement("canvas"),s=p.getContext("2d");if(n==="vertical"){const e=Math.max(...h.map(c=>c.naturalWidth)),w=h.reduce((c,u)=>{const g=e/u.naturalWidth;return c+Math.round(u.naturalHeight*g)},0)+l*(h.length-1);p.width=e,p.height=w;let i=0;for(const c of h){const u=e/c.naturalWidth,g=Math.round(c.naturalHeight*u);s.drawImage(c,0,i,e,g),i+=g+l}}else{const e=Math.max(...h.map(c=>c.naturalHeight)),w=h.reduce((c,u)=>{const g=e/u.naturalHeight;return c+Math.round(u.naturalWidth*g)},0)+l*(h.length-1);p.width=w,p.height=e;let i=0;for(const c of h){const u=e/c.naturalHeight,g=Math.round(c.naturalWidth*u);s.drawImage(c,i,0,g,e),i+=g+l}}const t=await new Promise((e,w)=>{p.toBlob(i=>i?e(i):w(new Error("拼接处理失败")),"image/png")}),r=URL.createObjectURL(t);return{success:!0,data:{拼接方向:n==="vertical"?"纵向":"横向",图片数量:h.length,图片尺寸:`${p.width} x ${p.height}`,文件大小:`${(t.size/1024).toFixed(1)} KB`},downloadUrl:r,filename:"stitched.png"}}catch(o){return{success:!1,error:o.message}}}async function J(d){try{const o=d.files,n=d.orientation||"auto",l=d.pageSize||"a4";if(!o)return{success:!1,error:"请选择图片文件"};const y=Array.isArray(o)?o:[o];if(y.length===0)return{success:!1,error:"请选择至少一张图片"};const h={a4:{width:595.28,height:841.89},letter:{width:612,height:792}},p=h[l]||h.a4,s=[];for(const e of y)s.push(await E(e));const t=document.createElement("canvas");if(y.length===1){const e=s[0],w=e.naturalWidth>e.naturalHeight;(n==="auto"?w:n==="landscape")?(t.width=p.height,t.height=p.width):(t.width=p.width,t.height=p.height);const c=t.getContext("2d");if(e.naturalWidth===0||e.naturalHeight===0)return{success:!1,error:"图片加载失败，请检查文件格式"};c.fillStyle="#FFFFFF",c.fillRect(0,0,t.width,t.height);const u=20,g=t.width-u*2,m=t.height-u*2,R=Math.min(g/e.naturalWidth,m/e.naturalHeight),b=e.naturalWidth*R,z=e.naturalHeight*R,f=(t.width-b)/2,x=(t.height-z)/2;c.drawImage(e,f,x,b,z)}else{const e=Math.max(...s.map(u=>u.naturalWidth)),w=s.reduce((u,g)=>{const m=e/g.naturalWidth;return u+g.naturalHeight*m},0);t.width=e,t.height=w;const i=t.getContext("2d");i.fillStyle="#FFFFFF",i.fillRect(0,0,t.width,t.height);let c=0;for(const u of s){const g=e/u.naturalWidth,m=u.naturalHeight*g;i.drawImage(u,0,c,e,m),c+=m}}const r=await new Promise((e,w)=>{t.toBlob(i=>i?e(i):w(new Error("转换失败")),"image/png")}),a=URL.createObjectURL(r);return{success:!0,data:{图片数量:y.length,页面大小:l.toUpperCase(),页面方向:n==="landscape"?"横向":n==="portrait"?"纵向":"自动",输出尺寸:`${t.width} x ${t.height} px`,文件大小:`${(r.size/1024).toFixed(1)} KB`,提示:"已生成图片格式，如需真正的PDF请使用浏览器打印功能(Ctrl+P)另存为PDF"},downloadUrl:a,filename:"images-to-pdf.png"}}catch(o){return{success:!1,error:o.message}}}async function V(d){try{const o=d.file,n=d.annotationType||"arrow-red",l=Number(d.startX??20)/100,y=Number(d.startY??30)/100,h=Number(d.endX??70)/100,p=Number(d.endY??60)/100,s=d.text||"";if(!o)return{success:!1,error:"请选择图片文件"};const t=await E(o),r=document.createElement("canvas");r.width=t.naturalWidth,r.height=t.naturalHeight;const a=r.getContext("2d");a.drawImage(t,0,0);const e=l*r.width,w=y*r.height,i=h*r.width,c=p*r.height,u=n.includes("red"),g=u?"#FF0000":"#00CC00",m=Math.max(3,Math.round(Math.min(r.width,r.height)*.005));if(n.startsWith("arrow")){a.strokeStyle=g,a.lineWidth=m,a.lineCap="round",a.beginPath(),a.moveTo(e,w),a.lineTo(i,c),a.stroke();const f=Math.atan2(c-w,i-e),x=m*8;a.beginPath(),a.moveTo(i,c),a.lineTo(i-x*Math.cos(f-Math.PI/6),c-x*Math.sin(f-Math.PI/6)),a.moveTo(i,c),a.lineTo(i-x*Math.cos(f+Math.PI/6),c-x*Math.sin(f+Math.PI/6)),a.stroke()}else if(n.startsWith("rect"))a.strokeStyle=g,a.lineWidth=m,a.strokeRect(e,w,i-e,c-w);else if(n==="text"&&s){const f=Math.max(16,Math.round(Math.min(r.width,r.height)*.03));a.font=`bold ${f}px sans-serif`,a.fillStyle=g;const x=f*.3,v=a.measureText(s);a.fillStyle="rgba(0,0,0,0.6)",a.fillRect(i-x,c-f-x,v.width+x*2,f+x*2),a.fillStyle="#FFFFFF",a.fillText(s,i,c)}const R=await new Promise((f,x)=>{r.toBlob(v=>v?f(v):x(new Error("标注失败")),"image/png")}),b=URL.createObjectURL(R);return{success:!0,data:{标注类型:n.startsWith("arrow")?"箭头":n.startsWith("rect")?"框选":"文字",标注颜色:u?"红色":"绿色",图片尺寸:`${r.width} x ${r.height}`,文件大小:`${(R.size/1024).toFixed(1)} KB`},downloadUrl:b,filename:"annotated.png"}}catch(o){return{success:!1,error:o.message}}}async function Z(d){try{const o=d.file;if(!o)return{success:!1,error:"请上传图片"};const n=new FileReader,l=await new Promise((h,p)=>{n.onload=()=>h(n.result),n.onerror=()=>p(new Error("图片读取失败")),n.readAsDataURL(o)});return{success:!0,type:"html",data:`<!DOCTYPE html>
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
</html>`}}catch(o){return{success:!1,error:`裁剪失败: ${o.message}`}}}async function Q(d){try{const o=d.files;let n=[];if(Array.isArray(o)?n=o:o instanceof File&&(n=[o]),n.length<2)return{success:!1,error:"请至少上传2个PDF文件"};const l=(await P(async()=>{const{default:i}=await import("./jszip.min-DqMG4rCX.js").then(c=>c.j);return{default:i}},__vite__mapDeps([0,1,2]))).default,y=new l;for(const i of n)if(!i.name.toLowerCase().endsWith(".pdf"))return{success:!1,error:`${i.name} 不是PDF文件`};const h=[];for(const i of n){const c=await i.arrayBuffer();h.push(new Uint8Array(c))}const s=[h[0]];for(let i=1;i<h.length;i++){const c=h[i],u=new TextEncoder().encode("%%EOF");let g=-1;for(let m=c.length-10;m>=0;m--){let R=!0;for(let b=0;b<u.length;b++)if(c[m+b]!==u[b]){R=!1;break}if(R){g=m;break}}g>=0?s.push(c.slice(0,g)):s.push(c)}const t=s.reduce((i,c)=>i+c.length,0),r=new Uint8Array(t);let a=0;for(const i of s)r.set(i,a),a+=i.length;const e=new Blob([r],{type:"application/pdf"}),w=URL.createObjectURL(e);return{success:!0,data:{合并文件数:`${n.length} 个`,文件列表:n.map(i=>i.name).join("、"),合并后大小:`${(e.size/1024/1024).toFixed(2)} MB`,提示:"PDF合并为简单拼接方式，复杂PDF建议使用专业工具"},downloadUrl:w,filename:"merged.pdf"}}catch(o){return{success:!1,error:`合并失败: ${o.message}`}}}async function tt(d){switch(d.mode||"compress"){case"convert":return D(d);case"resize":return j(d);default:return T(d)}}export{K as idPhoto,T as imageCompress,D as imageConvert,Z as imageCrop,tt as imageProcessor,j as imageResize,G as imageStitch,J as imageToPdf,_ as imageWatermark,q as imageWatermarkRemove,Q as pdfMerge,V as screenshotAnnotate};
