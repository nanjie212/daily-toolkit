import{Q as b}from"./index-Czq5qn7H.js";import{p,t as N}from"./date-CshA2hc-.js";import"./vendor-CR0zKoQR.js";import"./lucide-DAhqC6zD.js";import"./qrcode-DpynCwP9.js";function w(r){return r===""||r===null||r===void 0||Array.isArray(r)&&r.length===0}function M(r,e){if(w(r)){if(e!==void 0)return e;throw new Error("必填数值未填写")}const t=typeof r=="number"?r:Number(r);if(typeof t!="number"||Number.isNaN(t))throw new Error("请输入有效的数字");return t}async function z(r){try{const e=r.content,t=Number(r.size)||256,s=r.color||"#000000";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入内容"};const c=await b.toDataURL(e,{width:t,margin:2,color:{dark:s,light:"#FFFFFF"},errorCorrectionLevel:"M"});return{success:!0,data:c,downloadUrl:c,filename:"qrcode.png"}}catch(e){return{success:!1,error:`生成失败: ${e.message}`}}}const S={m:1,km:1e3,cm:.01,in:.0254,ft:.3048,mi:1609.344},k={kg:1,g:.001,lb:.453592,oz:.0283495};function T(r,e,t){let s;switch(e){case"c":s=r;break;case"f":s=(r-32)*5/9;break;case"k":s=r-273.15;break;default:return r}switch(t){case"c":return s;case"f":return s*9/5+32;case"k":return s+273.15;default:return s}}async function I(r){try{const e=r.value;if(e===""||e===null||e===void 0)return{success:!1,error:"请输入数值"};const t=Number(e),s=r.category||"length",c=r.fromUnit,o=r.toUnit;if(isNaN(t))return{success:!1,error:"请输入有效数值"};let n;const a={m:"米",km:"千米",cm:"厘米",in:"英寸",ft:"英尺",mi:"英里",kg:"千克",g:"克",lb:"磅",oz:"盎司",c:"摄氏度",f:"华氏度",k:"开尔文"};if(s==="temperature")n=T(t,c,o);else{const i=s==="length"?S:k,f=i[c],l=i[o];if(!f||!l)return{success:!1,error:"不支持的单位"};n=t*f/l}return{success:!0,data:`${t} ${a[c]||c} = ${Number(n.toFixed(6))} ${a[o]||o}`}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function A(r){try{const e=M(r.principal,1e6),t=M(r.rate,3.5),s=M(r.years,30),c=r.method||"equal-payment";if(e<=0)return{success:!1,error:"贷款金额必须大于0"};if(t<0||t>100)return{success:!1,error:"年利率应在0~100%之间"};if(s<=0||s>100)return{success:!1,error:"贷款年限应在1~100年之间"};const o=t/100/12,n=s*12;if(c==="equal-payment"){const a=Math.pow(1+o,n),i=o===0?e/n:e*o*a/(a-1),f=i*n,l=f-e;return{success:!0,data:`【等额本息】
贷款金额: ${e.toLocaleString()}元
年利率: ${t}%
贷款年限: ${s}年 (${n}期)

每月还款: ${i.toFixed(2)}元
还款总额: ${f.toFixed(2)}元
利息总额: ${l.toFixed(2)}元`}}else{const a=e/n,i=a+e*o,f=a+a*o;let l=0;for(let d=1;d<=n;d++)l+=a+(e-a*(d-1))*o;const u=l-e;return{success:!0,data:`【等额本金】
贷款金额: ${e.toLocaleString()}元
年利率: ${t}%
贷款年限: ${s}年 (${n}期)

首月还款: ${i.toFixed(2)}元
末月还款: ${f.toFixed(2)}元
每月递减: ${a*o<.01?a*o:(a*o).toFixed(2)}元
还款总额: ${l.toFixed(2)}元
利息总额: ${u.toFixed(2)}元`}}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function j(r){try{const e=Number(r.salary)||0,t=Number(r.socialInsurance)||0,s=Number(r.threshold)||5e3,c=Number(r.deductions)||0;if(e<=0)return{success:!1,error:"请输入有效的税前月薪"};if(t>e)return{success:!1,error:"五险一金不应超过税前月薪"};const o=e-t-s-c;if(o<=0)return{success:!0,data:`【个税计算结果】
税前月薪: ${e.toLocaleString()}元
五险一金: ${t.toLocaleString()}元
起征点: ${s.toLocaleString()}元
专项附加扣除: ${c.toLocaleString()}元

应纳税所得额: 0元
应缴个税: 0元
到手工资: ${(e-t).toLocaleString()}元`};const n=[{limit:3e3,rate:.03,deduction:0},{limit:12e3,rate:.1,deduction:210},{limit:25e3,rate:.2,deduction:1410},{limit:35e3,rate:.25,deduction:2660},{limit:55e3,rate:.3,deduction:4410},{limit:8e4,rate:.35,deduction:7160},{limit:1/0,rate:.45,deduction:15160}];let a=0,i=0,f=0;for(const u of n)if(o<=u.limit){i=u.rate,f=u.deduction,a=o*u.rate-u.deduction;break}const l=e-t-a;return{success:!0,data:`【个税计算结果】
税前月薪: ${e.toLocaleString()}元
五险一金: ${t.toLocaleString()}元
起征点: ${s.toLocaleString()}元
专项附加扣除: ${c.toLocaleString()}元

应纳税所得额: ${o.toLocaleString()}元
适用税率: ${(i*100).toFixed(0)}%
速算扣除数: ${f.toLocaleString()}元
应缴个税: ${a.toFixed(2)}元
到手工资: ${l.toFixed(2)}元`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function v(r){try{const e=Number(r.weight),t=Number(r.height);if(!e||!t)return{success:!1,error:"请输入有效的体重和身高"};if(e<=0||e>500)return{success:!1,error:"体重应在0~500kg之间"};if(t<=0||t>300)return{success:!1,error:"身高应在0~300cm之间"};const s=t/100,c=e/(s*s);let o,n;return c<18.5?(o="偏瘦",n="建议适当增加营养摄入，均衡饮食，适度锻炼增强体质。"):c<24?(o="正常",n="体重在健康范围内，请继续保持良好的生活习惯。"):c<28?(o="偏胖",n="建议控制饮食，减少高热量食物摄入，增加有氧运动。"):(o="肥胖",n="建议咨询医生，制定科学的减重计划，注意饮食和运动。"),{success:!0,data:`【BMI计算结果】
体重: ${e}kg
身高: ${t}cm

BMI值: ${c.toFixed(1)}
健康状态: ${o}

${n}`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function U(r){try{const e=r.mode||"diff",t=r.date1,s=r.date2||"";if(!t)return{success:!1,error:"请输入日期"};if(e==="diff"){const c=p(t);if(!c)return{success:!1,error:`"${t}" 不是有效日期`};const o=p(s);if(!o)return{success:!1,error:`"${s}" 不是有效日期`};const n=Math.abs(o.getTime()-c.getTime()),a=Math.floor(n/(1e3*60*60*24)),i=Math.floor(a/7);return{success:!0,data:`【日期差计算】
日期1: ${t}
日期2: ${s}

相差: ${a}天 (${i}周${a%7}天)`}}else if(e==="add"){const c=p(t);if(!c)return{success:!1,error:`"${t}" 不是有效日期`};const o=parseInt(s,10);if(isNaN(o))return{success:!1,error:"请输入有效的天数"};if(Math.abs(o)>365e4)return{success:!1,error:"推算天数超出可计算范围"};c.setDate(c.getDate()+o);const n=N(c);return{success:!0,data:`【日期推算】
起始日期: ${t}
推算天数: ${o>0?"+":""}${o}天

结果日期: ${n}`}}else{const c=p(t);if(!c)return{success:!1,error:`"${t}" 不是有效日期`};const o=new Date,n=c.getTime()-o.getTime(),a=Math.ceil(n/(1e3*60*60*24));return a>0?{success:!0,data:`【倒计时】
目标日期: ${t}

距离目标还有: ${a}天`}:a===0?{success:!0,data:`【倒计时】
目标日期: ${t}

就是今天！`}:{success:!0,data:`【倒计时】
目标日期: ${t}

已过去: ${Math.abs(a)}天`}}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function Y(r){try{const e=r.options,t=Number(r.count)||1;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入选项"};const s=e.split(`
`).map(a=>a.trim()).filter(a=>a.length>0);if(s.length===0)return{success:!1,error:"请输入至少一个选项"};const c=[],o=[...s],n=Math.min(t,o.length);for(let a=0;a<n;a++){const i=Math.floor(Math.random()*o.length);c.push(o[i]),o.splice(i,1)}return{success:!0,data:`【随机决策】
所有选项: ${s.join("、")}

🎯 选中: ${c.join("、")}`}}catch(e){return{success:!1,error:`决策失败: ${e.message}`}}}async function R(r){try{const e=r.names,t=Number(r.count)||1,s=r.allowRepeat;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入名单"};const c=e.split(`
`).map(n=>n.trim()).filter(n=>n.length>0);if(c.length===0)return{success:!1,error:"请输入至少一个名字"};if(!s&&t>c.length)return{success:!1,error:`不允许重复抽取，但名单只有${c.length}人，无法抽取${t}人`};const o=[];if(s)for(let n=0;n<t;n++){const a=Math.floor(Math.random()*c.length);o.push(c[a])}else{const n=[...c].sort(()=>Math.random()-.5);for(let a=0;a<t;a++)o.push(n[a])}return{success:!0,data:`【抽奖结果】
参与人数: ${c.length}
抽取人数: ${t}
允许重复: ${s?"是":"否"}

🎉 中签: ${o.join("、")}`}}catch(e){return{success:!1,error:`抽奖失败: ${e.message}`}}}async function H(r){try{const e=Number(r.workMinutes)||25,t=Number(r.breakMinutes)||5,s=Number(r.rounds)||4;if(e<=0||t<=0||s<=0)return{success:!1,error:"时长和轮数必须大于0"};if(e>480||t>120||s>50)return{success:!1,error:"请输入合理的时长和轮数"};const c=(e+t)*s-t,o=[];o.push("【番茄钟计划】"),o.push(`工作时长: ${e}分钟`),o.push(`休息时长: ${t}分钟`),o.push(`轮数: ${s}轮`),o.push(`总时长: ${c}分钟 (${Math.floor(c/60)}小时${c%60}分钟)`),o.push("");for(let n=1;n<=s;n++)o.push(`🍅 第${n}轮: 工作 ${e}分钟`),n<s&&o.push(`☕ 休息 ${t}分钟`);return{success:!0,data:o.join(`
`)}}catch(e){return{success:!1,error:`设置失败: ${e.message}`}}}async function P(r){try{const e=r.datetime,t=r.fromTimezone||"Asia/Shanghai",s=r.toTimezone||"America/New_York";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入时间"};const c=/^(\d{4}-\d{2}-\d{2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(e.trim());if(!c)return{success:!1,error:"时间格式无效，请使用 YYYY-MM-DD HH:mm"};const[,o,n,a,i="00"]=c;if(!p(o))return{success:!1,error:`"${o}" 不是有效日期，请检查是否为真实存在的日期`};const f=Number(n),l=Number(a),u=Number(i);if(f>23)return{success:!1,error:"小时应在 0~23 之间"};if(l>59)return{success:!1,error:"分钟应在 0~59 之间"};if(u>59)return{success:!1,error:"秒应在 0~59 之间"};const d=`${String(f).padStart(2,"0")}:${String(l).padStart(2,"0")}:${String(u).padStart(2,"0")}`,m=new Date(`${o}T${d}`);if(isNaN(m.getTime()))return{success:!1,error:"时间格式无效，请使用 YYYY-MM-DD HH:mm"};const $=new Intl.DateTimeFormat("zh-CN",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(m),h=new Intl.DateTimeFormat("zh-CN",{timeZone:s,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(m),g={"Asia/Shanghai":"北京时间","Asia/Tokyo":"东京时间","America/New_York":"纽约时间","Europe/London":"伦敦时间","America/Los_Angeles":"洛杉矶时间","Australia/Sydney":"悉尼时间"};return{success:!0,data:`【时区转换】
${g[t]||t}: ${$}
${g[s]||s}: ${h}`}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function q(r){try{const e=Number(r.length??16),t=Math.max(4,Math.min(256,e)),s=Number(r.count??5),c=Math.min(20,Math.max(1,s)),o=e!==t,n=s!==c||s===0&&c===1,a=r.includeUpper!==!1,i=r.includeLower!==!1,f=r.includeNumbers!==!1,l=r.includeSymbols!==!1;let u="";a&&(u+="ABCDEFGHIJKLMNOPQRSTUVWXYZ"),i&&(u+="abcdefghijklmnopqrstuvwxyz"),f&&(u+="0123456789"),l&&(u+="!@#$%^&*()_+-=[]{}|;:,.<>?"),u||(u="abcdefghijklmnopqrstuvwxyz0123456789");const d=[];for(let m=0;m<c;m++){const $=new Uint32Array(t);crypto.getRandomValues($);let h="";for(let g=0;g<t;g++)h+=u[$[g]%u.length];d.push(h)}return{success:!0,data:d.join(`
`),...o||n?{warning:`${o?`长度已自动调整为 ${t}（范围 4-256）`:""}${o&&n?"；":""}${n?`数量已自动调整为 ${c}（范围 1-20）`:""}`}:{}}}catch(e){return{success:!1,error:e.message}}}async function E(r){try{const e=r.text,t=r.mode||"all";if(!e)return{success:!1,error:"请输入文本内容"};let s=e;const c=a=>a.replace(/1[3-9]\d{9}/g,i=>i.slice(0,3)+"****"+i.slice(7)),o=a=>a.replace(/[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g,i=>i.slice(0,4)+"**********"+i.slice(14)),n=a=>a.replace(/\d{16,19}/g,i=>i.slice(0,4)+"********"+i.slice(-4));return(t==="phone"||t==="all")&&(s=c(s)),(t==="idcard"||t==="all")&&(s=o(s)),(t==="bankcard"||t==="all")&&(s=n(s)),{success:!0,data:s}}catch(e){return{success:!1,error:e.message}}}async function V(r){try{const e=r.expression;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入计算表达式"};const t=e.replace(/[^0-9+\-*/().%\s]/g,"");if(!t)return{success:!1,error:"表达式格式不正确"};const s=new Function(`"use strict"; return (${t})`)();if(typeof s!="number"||!isFinite(s))return{success:!1,error:"计算结果无效，请检查表达式"};const c=Number.isInteger(s)?s.toString():s.toFixed(6).replace(/\.?0+$/,"");return{success:!0,data:`【计算结果】
表达式: ${e}
结果: ${c}`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}function y(r){const e=Math.floor(r/6e4),t=Math.floor(r%6e4/1e3),s=Math.floor(r%1e3/10);return`${String(e).padStart(2,"0")}:${String(t).padStart(2,"0")}.${String(s).padStart(2,"0")}`}async function B(r){try{const e=r.action||"start",t=r.laps||"",s=Date.now(),c=t?t.split(",").map(Number).filter(o=>!isNaN(o)):[];if(e==="start")return{success:!0,data:`【秒表已启动】
开始时间: ${new Date(s).toLocaleTimeString("zh-CN")}

提示: 选择"计次"记录分段时间，选择"停止"结束计时

计次时请将"已有计次"填写为: ${s}`};if(e==="lap"&&c.length>0){const o=c[0],n=s-o,a=c.length>1?c[c.length-1]:o,i=s-a,f=[...c,s],l=[];let u=o;for(let d=1;d<f.length;d++){const m=f[d]-u;l.push(`第${d}次: ${y(m)}`),u=f[d]}return{success:!0,data:`【秒表计次】
本次计次: ${y(i)}
总用时: ${y(n)}

${l.join(`
`)}

继续计次请填写"已有计次": ${f.join(",")}`}}if(e==="stop"&&c.length>0){const o=c[0],n=s-o,a=[];let i=o;for(let l=1;l<c.length;l++){const u=c[l]-i;a.push(`第${l}次: ${y(u)}`),i=c[l]}const f=s-i;return a.push(`第${c.length}次: ${y(f)}`),{success:!0,data:`【秒表停止】
总用时: ${y(n)}

${a.join(`
`)}`}}return{success:!1,error:'请先选择"开始计时"启动秒表'}}catch(e){return{success:!1,error:e.message}}}async function _(r){try{const e=r.targetDate,t=r.targetTime||"00:00",s=r.eventName||"目标";if(!e)return{success:!1,error:"请输入目标日期"};if(!p(e))return{success:!1,error:`"${e}" 不是有效日期`};if(!/^\d{2}:\d{2}$/.test(t))return{success:!1,error:`"${t}" 不是有效时间，格式应为 HH:mm`};const c=new Date(`${e}T${t}:00`);if(isNaN(c.getTime()))return{success:!1,error:`"${e} ${t}" 不是有效时间`};const o=new Date,n=c.getTime()-o.getTime();if(n<=0){const m=o.getTime()-c.getTime(),$=Math.floor(m/864e5),h=Math.floor(m%864e5/36e5);return{success:!0,data:`【${s}】
目标时间: ${c.toLocaleString("zh-CN")}

已过去 ${$} 天 ${h} 小时`}}const a=Math.floor(n/864e5),i=Math.floor(n%864e5/36e5),f=Math.floor(n%36e5/6e4),l=Math.floor(n%6e4/1e3),u=Math.floor(n/36e5),d=Math.floor(n/6e4);return{success:!0,data:`【${s}倒计时】
目标时间: ${c.toLocaleString("zh-CN")}

剩余 ${a} 天 ${i} 小时 ${f} 分 ${l} 秒

≈ ${u} 小时
≈ ${d} 分钟`}}catch(e){return{success:!1,error:e.message}}}export{v as bmiCalculator,_ as countdown,U as dateCalculator,R as luckyDraw,A as mortgageCalculator,q as passwordGenerator,H as pomodoroTimer,z as qrcodeGenerator,Y as randomDecision,E as sensitiveMask,V as simpleCalculator,B as stopwatch,j as taxCalculator,P as timezoneConverter,I as unitConverter};
