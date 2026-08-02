import{g as p}from"./vendor-CR0zKoQR.js";import{r as M}from"./qrcode-DpynCwP9.js";import{t as N}from"./date-Bk9C5qmq.js";var w=M();const b=p(w);async function L(c){try{const e=c.content,t=Number(c.size)||256,s=c.color||"#000000";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入内容"};const o=await b.toDataURL(e,{width:t,margin:2,color:{dark:s,light:"#FFFFFF"},errorCorrectionLevel:"M"});return{success:!0,data:o,downloadUrl:o,filename:"qrcode.png"}}catch(e){return{success:!1,error:`生成失败: ${e.message}`}}}const D={m:1,km:1e3,cm:.01,in:.0254,ft:.3048,mi:1609.344},k={kg:1,g:.001,lb:.453592,oz:.0283495};function T(c,e,t){let s;switch(e){case"c":s=c;break;case"f":s=(c-32)*5/9;break;case"k":s=c-273.15;break;default:return c}switch(t){case"c":return s;case"f":return s*9/5+32;case"k":return s+273.15;default:return s}}async function C(c){try{const e=c.value;if(e===""||e===null||e===void 0)return{success:!1,error:"请输入数值"};const t=Number(e),s=c.category||"length",o=c.fromUnit,r=c.toUnit;if(isNaN(t))return{success:!1,error:"请输入有效数值"};let n;const a={m:"米",km:"千米",cm:"厘米",in:"英寸",ft:"英尺",mi:"英里",kg:"千克",g:"克",lb:"磅",oz:"盎司",c:"摄氏度",f:"华氏度",k:"开尔文"};if(s==="temperature")n=T(t,o,r);else{const i=s==="length"?D:k,l=i[o],f=i[r];if(!l||!f)return{success:!1,error:"不支持的单位"};n=t*l/f}return{success:!0,data:`${t} ${a[o]||o} = ${Number(n.toFixed(6))} ${a[r]||r}`}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function Y(c){try{const e=Number(c.principal)||1e6,t=Number(c.rate)||3.5,s=Number(c.years)||30,o=c.method||"equal-payment";if(e<=0)return{success:!1,error:"贷款金额必须大于0"};if(t<0||t>100)return{success:!1,error:"年利率应在0~100%之间"};if(s<=0||s>100)return{success:!1,error:"贷款年限应在1~100年之间"};const r=t/100/12,n=s*12;if(o==="equal-payment"){const a=e*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1),i=a*n,l=i-e;return{success:!0,data:`【等额本息】
贷款金额: ${e.toLocaleString()}元
年利率: ${t}%
贷款年限: ${s}年 (${n}期)

每月还款: ${a.toFixed(2)}元
还款总额: ${i.toFixed(2)}元
利息总额: ${l.toFixed(2)}元`}}else{const a=e/n,i=a+e*r,l=a+a*r;let f=0;for(let d=1;d<=n;d++)f+=a+(e-a*(d-1))*r;const u=f-e;return{success:!0,data:`【等额本金】
贷款金额: ${e.toLocaleString()}元
年利率: ${t}%
贷款年限: ${s}年 (${n}期)

首月还款: ${i.toFixed(2)}元
末月还款: ${l.toFixed(2)}元
每月递减: ${a*r<.01?a*r:(a*r).toFixed(2)}元
还款总额: ${f.toFixed(2)}元
利息总额: ${u.toFixed(2)}元`}}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function z(c){try{const e=Number(c.salary)||0,t=Number(c.socialInsurance)||0,s=Number(c.threshold)||5e3,o=Number(c.deductions)||0;if(e<=0)return{success:!1,error:"请输入有效的税前月薪"};if(t>e)return{success:!1,error:"五险一金不应超过税前月薪"};const r=e-t-s-o;if(r<=0)return{success:!0,data:`【个税计算结果】
税前月薪: ${e.toLocaleString()}元
五险一金: ${t.toLocaleString()}元
起征点: ${s.toLocaleString()}元
专项附加扣除: ${o.toLocaleString()}元

应纳税所得额: 0元
应缴个税: 0元
到手工资: ${(e-t).toLocaleString()}元`};const n=[{limit:3e3,rate:.03,deduction:0},{limit:12e3,rate:.1,deduction:210},{limit:25e3,rate:.2,deduction:1410},{limit:35e3,rate:.25,deduction:2660},{limit:55e3,rate:.3,deduction:4410},{limit:8e4,rate:.35,deduction:7160},{limit:1/0,rate:.45,deduction:15160}];let a=0,i=0,l=0;for(const u of n)if(r<=u.limit){i=u.rate,l=u.deduction,a=r*u.rate-u.deduction;break}const f=e-t-a;return{success:!0,data:`【个税计算结果】
税前月薪: ${e.toLocaleString()}元
五险一金: ${t.toLocaleString()}元
起征点: ${s.toLocaleString()}元
专项附加扣除: ${o.toLocaleString()}元

应纳税所得额: ${r.toLocaleString()}元
适用税率: ${(i*100).toFixed(0)}%
速算扣除数: ${l.toLocaleString()}元
应缴个税: ${a.toFixed(2)}元
到手工资: ${f.toFixed(2)}元`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function v(c){try{const e=Number(c.weight),t=Number(c.height);if(!e||!t)return{success:!1,error:"请输入有效的体重和身高"};if(e<=0||e>500)return{success:!1,error:"体重应在0~500kg之间"};if(t<=0||t>300)return{success:!1,error:"身高应在0~300cm之间"};const s=t/100,o=e/(s*s);let r,n;return o<18.5?(r="偏瘦",n="建议适当增加营养摄入，均衡饮食，适度锻炼增强体质。"):o<24?(r="正常",n="体重在健康范围内，请继续保持良好的生活习惯。"):o<28?(r="偏胖",n="建议控制饮食，减少高热量食物摄入，增加有氧运动。"):(r="肥胖",n="建议咨询医生，制定科学的减重计划，注意饮食和运动。"),{success:!0,data:`【BMI计算结果】
体重: ${e}kg
身高: ${t}cm

BMI值: ${o.toFixed(1)}
健康状态: ${r}

${n}`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function I(c){try{const e=c.mode||"diff",t=c.date1,s=c.date2||"",o=r=>{if(!r||!/^\d{4}-\d{2}-\d{2}$/.test(r))return!1;const n=new Date(r);return!isNaN(n.getTime())&&n.toISOString().slice(0,10)===r};if(!t)return{success:!1,error:"请输入日期"};if(e==="diff"){if(!o(t))return{success:!1,error:`"${t}" 不是有效日期`};if(!o(s))return{success:!1,error:`"${s}" 不是有效日期`};const r=new Date(t),n=new Date(s);if(isNaN(r.getTime())||isNaN(n.getTime()))return{success:!1,error:"日期格式无效，请使用 YYYY-MM-DD"};const a=Math.abs(n.getTime()-r.getTime()),i=Math.floor(a/(1e3*60*60*24)),l=Math.floor(i/7);return{success:!0,data:`【日期差计算】
日期1: ${t}
日期2: ${s}

相差: ${i}天 (${l}周${i%7}天)`}}else if(e==="add"){if(!o(t))return{success:!1,error:`"${t}" 不是有效日期`};const r=new Date(t),n=parseInt(s,10);if(isNaN(r.getTime()))return{success:!1,error:"日期格式无效，请使用 YYYY-MM-DD"};if(isNaN(n))return{success:!1,error:"请输入有效的天数"};r.setDate(r.getDate()+n);const a=N(r);return{success:!0,data:`【日期推算】
起始日期: ${t}
推算天数: ${n>0?"+":""}${n}天

结果日期: ${a}`}}else{if(!o(t))return{success:!1,error:`"${t}" 不是有效日期`};const r=new Date(t);if(isNaN(r.getTime()))return{success:!1,error:"日期格式无效，请使用 YYYY-MM-DD"};const n=new Date,a=r.getTime()-n.getTime(),i=Math.ceil(a/(1e3*60*60*24));return i>0?{success:!0,data:`【倒计时】
目标日期: ${t}

距离目标还有: ${i}天`}:i===0?{success:!0,data:`【倒计时】
目标日期: ${t}

就是今天！`}:{success:!0,data:`【倒计时】
目标日期: ${t}

已过去: ${Math.abs(i)}天`}}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function j(c){try{const e=c.options,t=Number(c.count)||1;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入选项"};const s=e.split(`
`).map(a=>a.trim()).filter(a=>a.length>0);if(s.length===0)return{success:!1,error:"请输入至少一个选项"};const o=[],r=[...s],n=Math.min(t,r.length);for(let a=0;a<n;a++){const i=Math.floor(Math.random()*r.length);o.push(r[i]),r.splice(i,1)}return{success:!0,data:`【随机决策】
所有选项: ${s.join("、")}

🎯 选中: ${o.join("、")}`}}catch(e){return{success:!1,error:`决策失败: ${e.message}`}}}async function A(c){try{const e=c.names,t=Number(c.count)||1,s=c.allowRepeat;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入名单"};const o=e.split(`
`).map(n=>n.trim()).filter(n=>n.length>0);if(o.length===0)return{success:!1,error:"请输入至少一个名字"};if(!s&&t>o.length)return{success:!1,error:`不允许重复抽取，但名单只有${o.length}人，无法抽取${t}人`};const r=[];if(s)for(let n=0;n<t;n++){const a=Math.floor(Math.random()*o.length);r.push(o[a])}else{const n=[...o].sort(()=>Math.random()-.5);for(let a=0;a<t;a++)r.push(n[a])}return{success:!0,data:`【抽奖结果】
参与人数: ${o.length}
抽取人数: ${t}
允许重复: ${s?"是":"否"}

🎉 中签: ${r.join("、")}`}}catch(e){return{success:!1,error:`抽奖失败: ${e.message}`}}}async function U(c){try{const e=Number(c.workMinutes)||25,t=Number(c.breakMinutes)||5,s=Number(c.rounds)||4;if(e<=0||t<=0||s<=0)return{success:!1,error:"时长和轮数必须大于0"};if(e>480||t>120||s>50)return{success:!1,error:"请输入合理的时长和轮数"};const o=(e+t)*s-t,r=[];r.push("【番茄钟计划】"),r.push(`工作时长: ${e}分钟`),r.push(`休息时长: ${t}分钟`),r.push(`轮数: ${s}轮`),r.push(`总时长: ${o}分钟 (${Math.floor(o/60)}小时${o%60}分钟)`),r.push("");for(let n=1;n<=s;n++)r.push(`🍅 第${n}轮: 工作 ${e}分钟`),n<s&&r.push(`☕ 休息 ${t}分钟`);return{success:!0,data:r.join(`
`)}}catch(e){return{success:!1,error:`设置失败: ${e.message}`}}}async function R(c){try{const e=c.datetime,t=c.fromTimezone||"Asia/Shanghai",s=c.toTimezone||"America/New_York";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入时间"};const o=new Date(e);if(isNaN(o.getTime()))return{success:!1,error:"时间格式无效，请使用 YYYY-MM-DD HH:mm"};const r=new Intl.DateTimeFormat("zh-CN",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(o),n=new Intl.DateTimeFormat("zh-CN",{timeZone:s,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(o),a={"Asia/Shanghai":"北京时间","Asia/Tokyo":"东京时间","America/New_York":"纽约时间","Europe/London":"伦敦时间","America/Los_Angeles":"洛杉矶时间","Australia/Sydney":"悉尼时间"};return{success:!0,data:`【时区转换】
${a[t]||t}: ${r}
${a[s]||s}: ${n}`}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function q(c){try{const e=Number(c.length??16),t=Math.max(4,Math.min(256,e)),s=Number(c.count??5),o=Math.min(20,Math.max(1,s)),r=e!==t,n=s!==o||s===0&&o===1,a=c.includeUpper!==!1,i=c.includeLower!==!1,l=c.includeNumbers!==!1,f=c.includeSymbols!==!1;let u="";a&&(u+="ABCDEFGHIJKLMNOPQRSTUVWXYZ"),i&&(u+="abcdefghijklmnopqrstuvwxyz"),l&&(u+="0123456789"),f&&(u+="!@#$%^&*()_+-=[]{}|;:,.<>?"),u||(u="abcdefghijklmnopqrstuvwxyz0123456789");const d=[];for(let m=0;m<o;m++){const h=new Uint32Array(t);crypto.getRandomValues(h);let g="";for(let y=0;y<t;y++)g+=u[h[y]%u.length];d.push(g)}return{success:!0,data:d.join(`
`),...r||n?{warning:`${r?`长度已自动调整为 ${t}（范围 4-256）`:""}${r&&n?"；":""}${n?`数量已自动调整为 ${o}（范围 1-20）`:""}`}:{}}}catch(e){return{success:!1,error:e.message}}}async function P(c){try{const e=c.text,t=c.mode||"all";if(!e)return{success:!1,error:"请输入文本内容"};let s=e;const o=a=>a.replace(/1[3-9]\d{9}/g,i=>i.slice(0,3)+"****"+i.slice(7)),r=a=>a.replace(/[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g,i=>i.slice(0,4)+"**********"+i.slice(14)),n=a=>a.replace(/\d{16,19}/g,i=>i.slice(0,4)+"********"+i.slice(-4));return(t==="phone"||t==="all")&&(s=o(s)),(t==="idcard"||t==="all")&&(s=r(s)),(t==="bankcard"||t==="all")&&(s=n(s)),{success:!0,data:s}}catch(e){return{success:!1,error:e.message}}}async function B(c){try{const e=c.expression;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入计算表达式"};const t=e.replace(/[^0-9+\-*/().%\s]/g,"");if(!t)return{success:!1,error:"表达式格式不正确"};const s=new Function(`"use strict"; return (${t})`)();if(typeof s!="number"||!isFinite(s))return{success:!1,error:"计算结果无效，请检查表达式"};const o=Number.isInteger(s)?s.toString():s.toFixed(6).replace(/\.?0+$/,"");return{success:!0,data:`【计算结果】
表达式: ${e}
结果: ${o}`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}function $(c){const e=Math.floor(c/6e4),t=Math.floor(c%6e4/1e3),s=Math.floor(c%1e3/10);return`${String(e).padStart(2,"0")}:${String(t).padStart(2,"0")}.${String(s).padStart(2,"0")}`}async function V(c){try{const e=c.action||"start",t=c.laps||"",s=Date.now(),o=t?t.split(",").map(Number).filter(r=>!isNaN(r)):[];if(e==="start")return{success:!0,data:`【秒表已启动】
开始时间: ${new Date(s).toLocaleTimeString("zh-CN")}

提示: 选择"计次"记录分段时间，选择"停止"结束计时

计次时请将"已有计次"填写为: ${s}`};if(e==="lap"&&o.length>0){const r=o[0],n=s-r,a=o.length>1?o[o.length-1]:r,i=s-a,l=[...o,s],f=[];let u=r;for(let d=1;d<l.length;d++){const m=l[d]-u;f.push(`第${d}次: ${$(m)}`),u=l[d]}return{success:!0,data:`【秒表计次】
本次计次: ${$(i)}
总用时: ${$(n)}

${f.join(`
`)}

继续计次请填写"已有计次": ${l.join(",")}`}}if(e==="stop"&&o.length>0){const r=o[0],n=s-r,a=[];let i=r;for(let f=1;f<o.length;f++){const u=o[f]-i;a.push(`第${f}次: ${$(u)}`),i=o[f]}const l=s-i;return a.push(`第${o.length}次: ${$(l)}`),{success:!0,data:`【秒表停止】
总用时: ${$(n)}

${a.join(`
`)}`}}return{success:!1,error:'请先选择"开始计时"启动秒表'}}catch(e){return{success:!1,error:e.message}}}async function E(c){try{const e=c.targetDate,t=c.targetTime||"00:00",s=c.eventName||"目标";if(!e)return{success:!1,error:"请输入目标日期"};if(!/^\d{4}-\d{2}-\d{2}$/.test(e))return{success:!1,error:`"${e}" 不是有效日期`};const o=new Date(`${e}T${t}:00`);if(isNaN(o.getTime())||o.toISOString().slice(0,10)!==e)return{success:!1,error:`"${e}" 不是有效日期`};const r=new Date,n=o.getTime()-r.getTime();if(n<=0){const m=r.getTime()-o.getTime(),h=Math.floor(m/864e5),g=Math.floor(m%864e5/36e5);return{success:!0,data:`【${s}】
目标时间: ${o.toLocaleString("zh-CN")}

已过去 ${h} 天 ${g} 小时`}}const a=Math.floor(n/864e5),i=Math.floor(n%864e5/36e5),l=Math.floor(n%36e5/6e4),f=Math.floor(n%6e4/1e3),u=Math.floor(n/36e5),d=Math.floor(n/6e4);return{success:!0,data:`【${s}倒计时】
目标时间: ${o.toLocaleString("zh-CN")}

剩余 ${a} 天 ${i} 小时 ${l} 分 ${f} 秒

≈ ${u} 小时
≈ ${d} 分钟`}}catch(e){return{success:!1,error:e.message}}}export{v as bmiCalculator,E as countdown,I as dateCalculator,A as luckyDraw,Y as mortgageCalculator,q as passwordGenerator,U as pomodoroTimer,L as qrcodeGenerator,j as randomDecision,P as sensitiveMask,B as simpleCalculator,V as stopwatch,z as taxCalculator,R as timezoneConverter,C as unitConverter};
