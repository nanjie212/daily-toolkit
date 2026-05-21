import{g as y}from"./vendor-DqKY06Xw.js";import{r as p}from"./qrcode-DpynCwP9.js";var N=p();const M=y(N);async function x(c){try{const e=c.content,r=Number(c.size)||256,t=c.color||"#000000";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入内容"};const s=await M.toDataURL(e,{width:r,margin:2,color:{dark:t,light:"#FFFFFF"},errorCorrectionLevel:"M"});return{success:!0,data:s,downloadUrl:s,filename:"qrcode.png"}}catch(e){return{success:!1,error:`生成失败: ${e.message}`}}}const w={m:1,km:1e3,cm:.01,in:.0254,ft:.3048,mi:1609.344},b={kg:1,g:.001,lb:.453592,oz:.0283495};function D(c,e,r){let t;switch(e){case"c":t=c;break;case"f":t=(c-32)*5/9;break;case"k":t=c-273.15;break;default:return c}switch(r){case"c":return t;case"f":return t*9/5+32;case"k":return t+273.15;default:return t}}async function S(c){try{const e=Number(c.value),r=c.category||"length",t=c.fromUnit,s=c.toUnit;if(isNaN(e))return{success:!1,error:"请输入有效数值"};let o;const n={m:"米",km:"千米",cm:"厘米",in:"英寸",ft:"英尺",mi:"英里",kg:"千克",g:"克",lb:"磅",oz:"盎司",c:"摄氏度",f:"华氏度",k:"开尔文"};if(r==="temperature")o=D(e,t,s);else{const a=r==="length"?w:b,i=a[t],u=a[s];if(!i||!u)return{success:!1,error:"不支持的单位"};o=e*i/u}return{success:!0,data:`${e} ${n[t]||t} = ${Number(o.toFixed(6))} ${n[s]||s}`}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function F(c){try{const e=Number(c.principal)||100,r=Number(c.rate)||3.5,t=Number(c.years)||30,s=c.method||"equal-payment",o=e*1e4,n=r/100/12,a=t*12;if(s==="equal-payment"){const i=o*n*Math.pow(1+n,a)/(Math.pow(1+n,a)-1),u=i*a,l=u-o;return{success:!0,data:`【等额本息】
贷款金额: ${e}万元 (${o.toLocaleString()}元)
年利率: ${r}%
贷款年限: ${t}年 (${a}期)

每月还款: ${i.toFixed(2)}元
还款总额: ${u.toFixed(2)}元
利息总额: ${l.toFixed(2)}元`}}else{const i=o/a,u=i+o*n,l=i+i*n;let f=0;for(let d=1;d<=a;d++)f+=i+(o-i*(d-1))*n;const m=f-o;return{success:!0,data:`【等额本金】
贷款金额: ${e}万元 (${o.toLocaleString()}元)
年利率: ${r}%
贷款年限: ${t}年 (${a}期)

首月还款: ${u.toFixed(2)}元
末月还款: ${l.toFixed(2)}元
每月递减: ${i*n<.01?i*n:(i*n).toFixed(2)}元
还款总额: ${f.toFixed(2)}元
利息总额: ${m.toFixed(2)}元`}}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function L(c){try{const e=Number(c.salary)||0,r=Number(c.socialInsurance)||0,t=Number(c.threshold)||5e3,s=Number(c.deductions)||0,o=e-r-t-s;if(o<=0)return{success:!0,data:`【个税计算结果】
税前月薪: ${e.toLocaleString()}元
五险一金: ${r.toLocaleString()}元
起征点: ${t.toLocaleString()}元
专项附加扣除: ${s.toLocaleString()}元

应纳税所得额: 0元
应缴个税: 0元
到手工资: ${(e-r).toLocaleString()}元`};const n=[{limit:3e3,rate:.03,deduction:0},{limit:12e3,rate:.1,deduction:210},{limit:25e3,rate:.2,deduction:1410},{limit:35e3,rate:.25,deduction:2660},{limit:55e3,rate:.3,deduction:4410},{limit:8e4,rate:.35,deduction:7160},{limit:1/0,rate:.45,deduction:15160}];let a=0,i=0,u=0;for(const f of n)if(o<=f.limit){i=f.rate,u=f.deduction,a=o*f.rate-f.deduction;break}const l=e-r-a;return{success:!0,data:`【个税计算结果】
税前月薪: ${e.toLocaleString()}元
五险一金: ${r.toLocaleString()}元
起征点: ${t.toLocaleString()}元
专项附加扣除: ${s.toLocaleString()}元

应纳税所得额: ${o.toLocaleString()}元
适用税率: ${(i*100).toFixed(0)}%
速算扣除数: ${u.toLocaleString()}元
应缴个税: ${a.toFixed(2)}元
到手工资: ${l.toFixed(2)}元`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function C(c){try{const e=Number(c.weight),r=Number(c.height);if(!e||!r)return{success:!1,error:"请输入有效的体重和身高"};const t=r/100,s=e/(t*t);let o,n;return s<18.5?(o="偏瘦",n="建议适当增加营养摄入，均衡饮食，适度锻炼增强体质。"):s<24?(o="正常",n="体重在健康范围内，请继续保持良好的生活习惯。"):s<28?(o="偏胖",n="建议控制饮食，减少高热量食物摄入，增加有氧运动。"):(o="肥胖",n="建议咨询医生，制定科学的减重计划，注意饮食和运动。"),{success:!0,data:`【BMI计算结果】
体重: ${e}kg
身高: ${r}cm

BMI值: ${s.toFixed(1)}
健康状态: ${o}

${n}`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function Y(c){try{const e=c.mode||"diff",r=c.date1,t=c.date2||"";if(!r)return{success:!1,error:"请输入日期"};if(e==="diff"){const s=new Date(r),o=new Date(t);if(isNaN(s.getTime())||isNaN(o.getTime()))return{success:!1,error:"日期格式无效，请使用 YYYY-MM-DD"};const n=Math.abs(o.getTime()-s.getTime()),a=Math.floor(n/(1e3*60*60*24)),i=Math.floor(a/7);return{success:!0,data:`【日期差计算】
日期1: ${r}
日期2: ${t}

相差: ${a}天 (${i}周${a%7}天)`}}else if(e==="add"){const s=new Date(r),o=parseInt(t,10);if(isNaN(s.getTime()))return{success:!1,error:"日期格式无效，请使用 YYYY-MM-DD"};if(isNaN(o))return{success:!1,error:"请输入有效的天数"};s.setDate(s.getDate()+o);const n=s.toISOString().split("T")[0];return{success:!0,data:`【日期推算】
起始日期: ${r}
推算天数: ${o>0?"+":""}${o}天

结果日期: ${n}`}}else{const s=new Date(r);if(isNaN(s.getTime()))return{success:!1,error:"日期格式无效，请使用 YYYY-MM-DD"};const o=new Date,n=s.getTime()-o.getTime(),a=Math.ceil(n/(1e3*60*60*24));return a>0?{success:!0,data:`【倒计时】
目标日期: ${r}

距离目标还有: ${a}天`}:a===0?{success:!0,data:`【倒计时】
目标日期: ${r}

就是今天！`}:{success:!0,data:`【倒计时】
目标日期: ${r}

已过去: ${Math.abs(a)}天`}}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}async function z(c){try{const e=c.options,r=Number(c.count)||1;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入选项"};const t=e.split(`
`).map(a=>a.trim()).filter(a=>a.length>0);if(t.length===0)return{success:!1,error:"请输入至少一个选项"};const s=[],o=[...t],n=Math.min(r,o.length);for(let a=0;a<n;a++){const i=Math.floor(Math.random()*o.length);s.push(o[i]),o.splice(i,1)}return{success:!0,data:`【随机决策】
所有选项: ${t.join("、")}

🎯 选中: ${s.join("、")}`}}catch(e){return{success:!1,error:`决策失败: ${e.message}`}}}async function v(c){try{const e=c.names,r=Number(c.count)||1,t=c.allowRepeat;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入名单"};const s=e.split(`
`).map(n=>n.trim()).filter(n=>n.length>0);if(s.length===0)return{success:!1,error:"请输入至少一个名字"};if(!t&&r>s.length)return{success:!1,error:`不允许重复抽取，但名单只有${s.length}人，无法抽取${r}人`};const o=[];if(t)for(let n=0;n<r;n++){const a=Math.floor(Math.random()*s.length);o.push(s[a])}else{const n=[...s].sort(()=>Math.random()-.5);for(let a=0;a<r;a++)o.push(n[a])}return{success:!0,data:`【抽奖结果】
参与人数: ${s.length}
抽取人数: ${r}
允许重复: ${t?"是":"否"}

🎉 中签: ${o.join("、")}`}}catch(e){return{success:!1,error:`抽奖失败: ${e.message}`}}}async function I(c){try{const e=Number(c.workMinutes)||25,r=Number(c.breakMinutes)||5,t=Number(c.rounds)||4,s=(e+r)*t-r,o=[];o.push("【番茄钟计划】"),o.push(`工作时长: ${e}分钟`),o.push(`休息时长: ${r}分钟`),o.push(`轮数: ${t}轮`),o.push(`总时长: ${s}分钟 (${Math.floor(s/60)}小时${s%60}分钟)`),o.push("");for(let n=1;n<=t;n++)o.push(`🍅 第${n}轮: 工作 ${e}分钟`),n<t&&o.push(`☕ 休息 ${r}分钟`);return{success:!0,data:o.join(`
`)}}catch(e){return{success:!1,error:`设置失败: ${e.message}`}}}async function U(c){try{const e=c.datetime,r=c.fromTimezone||"Asia/Shanghai",t=c.toTimezone||"America/New_York";if(!(e!=null&&e.trim()))return{success:!1,error:"请输入时间"};const s=new Date(e);if(isNaN(s.getTime()))return{success:!1,error:"时间格式无效，请使用 YYYY-MM-DD HH:mm"};const o=new Intl.DateTimeFormat("zh-CN",{timeZone:r,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(s),n=new Intl.DateTimeFormat("zh-CN",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(s),a={"Asia/Shanghai":"北京时间","Asia/Tokyo":"东京时间","America/New_York":"纽约时间","Europe/London":"伦敦时间","America/Los_Angeles":"洛杉矶时间","Australia/Sydney":"悉尼时间"};return{success:!0,data:`【时区转换】
${a[r]||r}: ${o}
${a[t]||t}: ${n}`}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function j(c){try{const e=Math.max(4,Number(c.length??16)),r=Math.min(20,Math.max(1,Number(c.count??5))),t=c.includeUpper!==!1,s=c.includeLower!==!1,o=c.includeNumbers!==!1,n=c.includeSymbols!==!1;let a="";t&&(a+="ABCDEFGHIJKLMNOPQRSTUVWXYZ"),s&&(a+="abcdefghijklmnopqrstuvwxyz"),o&&(a+="0123456789"),n&&(a+="!@#$%^&*()_+-=[]{}|;:,.<>?"),a||(a="abcdefghijklmnopqrstuvwxyz0123456789");const i=[];for(let u=0;u<r;u++){const l=new Uint32Array(e);crypto.getRandomValues(l);let f="";for(let m=0;m<e;m++)f+=a[l[m]%a.length];i.push(f)}return{success:!0,data:i.join(`
`)}}catch(e){return{success:!1,error:e.message}}}async function R(c){var e;try{const r=Number(c.amount),t=c.from||"USD",s=c.to||"CNY";if(!r||r<=0)return{success:!1,error:"请输入有效的金额"};const o=await fetch(`https://api.exchangerate-api.com/v4/latest/${t}`);if(!o.ok)return{success:!1,error:"无法获取汇率数据，请稍后重试"};const n=await o.json(),a=(e=n.rates)==null?void 0:e[s];if(!a)return{success:!1,error:`不支持该货币: ${s}`};const i=(r*a).toFixed(2),u={USD:"美元",CNY:"人民币",EUR:"欧元",GBP:"英镑",JPY:"日元",KRW:"韩元",HKD:"港币",TWD:"新台币",AUD:"澳元",CAD:"加元",SGD:"新加坡元",THB:"泰铢"};return{success:!0,data:{换算结果:`${r} ${u[t]||t} = ${i} ${u[s]||s}`,汇率:`1 ${t} = ${a.toFixed(4)} ${s}`,更新时间:n.date||"未知",提示:"汇率数据仅供参考，实际交易以银行汇率为准"}}}catch(r){return{success:!1,error:`汇率查询失败: ${r.message}`}}}async function A(c){try{const e=c.text,r=c.mode||"all";if(!e)return{success:!1,error:"请输入文本内容"};let t=e;const s=a=>a.replace(/1[3-9]\d{9}/g,i=>i.slice(0,3)+"****"+i.slice(7)),o=a=>a.replace(/[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g,i=>i.slice(0,4)+"**********"+i.slice(14)),n=a=>a.replace(/\d{16,19}/g,i=>i.slice(0,4)+"********"+i.slice(-4));return(r==="phone"||r==="all")&&(t=s(t)),(r==="idcard"||r==="all")&&(t=o(t)),(r==="bankcard"||r==="all")&&(t=n(t)),{success:!0,data:t}}catch(e){return{success:!1,error:e.message}}}async function P(c){try{const e=c.expression;if(!(e!=null&&e.trim()))return{success:!1,error:"请输入计算表达式"};const r=e.replace(/[^0-9+\-*/().%\s]/g,"");if(!r)return{success:!1,error:"表达式格式不正确"};const t=new Function(`"use strict"; return (${r})`)();if(typeof t!="number"||!isFinite(t))return{success:!1,error:"计算结果无效，请检查表达式"};const s=Number.isInteger(t)?t.toString():t.toFixed(6).replace(/\.?0+$/,"");return{success:!0,data:`【计算结果】
表达式: ${e}
结果: ${s}`}}catch(e){return{success:!1,error:`计算失败: ${e.message}`}}}function h(c){const e=Math.floor(c/6e4),r=Math.floor(c%6e4/1e3),t=Math.floor(c%1e3/10);return`${String(e).padStart(2,"0")}:${String(r).padStart(2,"0")}.${String(t).padStart(2,"0")}`}async function q(c){try{const e=c.action||"start",r=c.laps||"",t=Date.now(),s=r?r.split(",").map(Number).filter(o=>!isNaN(o)):[];if(e==="start")return{success:!0,data:`【秒表已启动】
开始时间: ${new Date(t).toLocaleTimeString("zh-CN")}

提示: 选择"计次"记录分段时间，选择"停止"结束计时

计次时请将"已有计次"填写为: ${t}`};if(e==="lap"&&s.length>0){const o=s[0],n=t-o,a=s.length>1?s[s.length-1]:o,i=t-a,u=[...s,t],l=[];let f=o;for(let m=1;m<u.length;m++){const d=u[m]-f;l.push(`第${m}次: ${h(d)}`),f=u[m]}return{success:!0,data:`【秒表计次】
本次计次: ${h(i)}
总用时: ${h(n)}

${l.join(`
`)}

继续计次请填写"已有计次": ${u.join(",")}`}}if(e==="stop"&&s.length>0){const o=s[0],n=t-o,a=[];let i=o;for(let l=1;l<s.length;l++){const f=s[l]-i;a.push(`第${l}次: ${h(f)}`),i=s[l]}const u=t-i;return a.push(`第${s.length}次: ${h(u)}`),{success:!0,data:`【秒表停止】
总用时: ${h(n)}

${a.join(`
`)}`}}return{success:!1,error:'请先选择"开始计时"启动秒表'}}catch(e){return{success:!1,error:e.message}}}async function B(c){try{const e=c.targetDate,r=c.targetTime||"00:00",t=c.eventName||"目标";if(!e)return{success:!1,error:"请输入目标日期"};const s=new Date(`${e}T${r}:00`);if(isNaN(s.getTime()))return{success:!1,error:"日期格式不正确"};const o=new Date,n=s.getTime()-o.getTime();if(n<=0){const d=o.getTime()-s.getTime(),$=Math.floor(d/864e5),g=Math.floor(d%864e5/36e5);return{success:!0,data:`【${t}】
目标时间: ${s.toLocaleString("zh-CN")}

已过去 ${$} 天 ${g} 小时`}}const a=Math.floor(n/864e5),i=Math.floor(n%864e5/36e5),u=Math.floor(n%36e5/6e4),l=Math.floor(n%6e4/1e3),f=Math.floor(n/36e5),m=Math.floor(n/6e4);return{success:!0,data:`【${t}倒计时】
目标时间: ${s.toLocaleString("zh-CN")}

剩余 ${a} 天 ${i} 小时 ${u} 分 ${l} 秒

≈ ${f} 小时
≈ ${m} 分钟`}}catch(e){return{success:!1,error:e.message}}}export{C as bmiCalculator,B as countdown,Y as dateCalculator,R as exchangeRate,v as luckyDraw,F as mortgageCalculator,j as passwordGenerator,I as pomodoroTimer,x as qrcodeGenerator,z as randomDecision,A as sensitiveMask,P as simpleCalculator,q as stopwatch,L as taxCalculator,U as timezoneConverter,S as unitConverter};
