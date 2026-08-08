import{_ as d}from"./index-Do9tZiYs.js";import"./vendor-C5FzE17K.js";import"./lucide-CHlLN2cv.js";import"./qrcode-DpynCwP9.js";let f=null;function p(){return f||(f=d(()=>import("./opencc-QlctpKfI.js"),[])),f}async function m(s){try{const e=s.text;if(!e)return{success:!1,error:"请输入文本内容"};const o=e.length,t=e.replace(/\s/g,"").length,r=e.trim()?e.trim().split(/\s+/).length:0,n=(e.match(/[\u4e00-\u9fff]/g)||[]).length,l=e.split(`
`).length,i=e.split(/\n\s*\n/).filter(a=>a.trim()).length,c=(e.match(/[.!?。！？]+/g)||[]).length;return{success:!0,data:{总字符数:o,不含空格字符数:t,单词数:r,中文字符数:n,行数:l,段落数:i,句子数:c}}}catch(e){return{success:!1,error:`统计失败: ${e.message}`}}}async function h(s){try{const e=s.text,o=s.mode||"t2s";if(!e)return{success:!1,error:"请输入文本内容"};const t=await p();let r;return o==="t2s"?r=t.Converter({from:"tw",to:"cn"})(e):r=t.Converter({from:"cn",to:"tw"})(e),{success:!0,data:r}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function g(s){try{const e=s.text,o=s.mode||"upper";if(!e)return{success:!1,error:"请输入文本内容"};let t;switch(o){case"upper":t=e.toUpperCase();break;case"lower":t=e.toLowerCase();break;case"capitalize":t=e.replace(/\b\w/g,r=>r.toUpperCase());break;case"sentence":t=e.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,r=>r.toUpperCase());break;case"alternating":t=e.split("").map((r,n)=>n%2===0?r.toLowerCase():r.toUpperCase()).join("");break;default:t=e}return{success:!0,data:t}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function C(s){try{const e=s.text,o=s.mode||"exact";if(!e)return{success:!1,error:"请输入文本内容"};const t=e.split(`
`),r=t.length;let n;switch(o){case"exact":{const c=new Set,a=[];for(const u of t)c.has(u)||(c.add(u),a.push(u));n=a.join(`
`);break}case"blank":{n=t.filter(a=>a.trim()!=="").join(`
`);break}case"sort":{const c=[...new Set(t)];c.sort(),n=c.join(`
`);break}default:n=e}const l=n.split(`
`),i=r-l.length;return{success:!0,data:`${n}

--- 去重统计 ---
原始行数: ${r}
去重后行数: ${l.length}
移除行数: ${i}`}}catch(e){return{success:!1,error:`去重失败: ${e.message}`}}}async function k(s){switch(s.mode||"text-counter"){case"traditional-simplified":return h(s);case"case-converter":return g(s);case"text-dedup":return C(s);default:return m(s)}}export{g as caseConverter,m as textCounter,C as textDedup,k as textProcessor,h as traditionalSimplified};
