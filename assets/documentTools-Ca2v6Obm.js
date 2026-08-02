import{w as f}from"./opencc-Cf4OmlUd.js";async function d(s){try{const e=s.text;if(!e)return{success:!1,error:"请输入文本内容"};const o=e.length,t=e.replace(/\s/g,"").length,r=e.trim()?e.trim().split(/\s+/).length:0,c=(e.match(/[\u4e00-\u9fff]/g)||[]).length,l=e.split(`
`).length,u=e.split(/\n\s*\n/).filter(a=>a.trim()).length,n=(e.match(/[.!?。！？]+/g)||[]).length;return{success:!0,data:{总字符数:o,不含空格字符数:t,单词数:r,中文字符数:c,行数:l,段落数:u,句子数:n}}}catch(e){return{success:!1,error:`统计失败: ${e.message}`}}}async function m(s){try{const e=s.text,o=s.mode||"t2s";if(!e)return{success:!1,error:"请输入文本内容"};let t;return o==="t2s"?t=f({from:"tw",to:"cn"})(e):t=f({from:"cn",to:"tw"})(e),{success:!0,data:t}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function h(s){try{const e=s.text,o=s.mode||"upper";if(!e)return{success:!1,error:"请输入文本内容"};let t;switch(o){case"upper":t=e.toUpperCase();break;case"lower":t=e.toLowerCase();break;case"capitalize":t=e.replace(/\b\w/g,r=>r.toUpperCase());break;case"sentence":t=e.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,r=>r.toUpperCase());break;case"alternating":t=e.split("").map((r,c)=>c%2===0?r.toLowerCase():r.toUpperCase()).join("");break;default:t=e}return{success:!0,data:t}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function p(s){try{const e=s.text,o=s.mode||"exact";if(!e)return{success:!1,error:"请输入文本内容"};const t=e.split(`
`),r=t.length;let c;switch(o){case"exact":{const n=new Set,a=[];for(const i of t)n.has(i)||(n.add(i),a.push(i));c=a.join(`
`);break}case"blank":{c=t.filter(a=>a.trim()!=="").join(`
`);break}case"sort":{const n=[...new Set(t)];n.sort(),c=n.join(`
`);break}default:c=e}const l=c.split(`
`),u=r-l.length;return{success:!0,data:`${c}

--- 去重统计 ---
原始行数: ${r}
去重后行数: ${l.length}
移除行数: ${u}`}}catch(e){return{success:!1,error:`去重失败: ${e.message}`}}}async function w(s){switch(s.mode||"text-counter"){case"traditional-simplified":return m(s);case"case-converter":return h(s);case"text-dedup":return p(s);default:return d(s)}}export{h as caseConverter,d as textCounter,p as textDedup,w as textProcessor,m as traditionalSimplified};
