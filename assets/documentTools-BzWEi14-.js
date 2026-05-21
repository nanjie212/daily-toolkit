import{w as f}from"./opencc-Cf4OmlUd.js";async function h(r){try{const e=r.text;if(!e)return{success:!1,error:"请输入文本内容"};const o=e.length,t=e.replace(/\s/g,"").length,s=e.trim()?e.trim().split(/\s+/).length:0,n=(e.match(/[\u4e00-\u9fff]/g)||[]).length,l=e.split(`
`).length,u=e.split(/\n\s*\n/).filter(a=>a.trim()).length,c=(e.match(/[.!?。！？]+/g)||[]).length;return{success:!0,data:{总字符数:o,不含空格字符数:t,单词数:s,中文字符数:n,行数:l,段落数:u,句子数:c}}}catch(e){return{success:!1,error:`统计失败: ${e.message}`}}}async function m(r){try{const e=r.text,o=r.mode||"t2s";if(!e)return{success:!1,error:"请输入文本内容"};let t;return o==="t2s"?t=f({from:"tw",to:"cn"})(e):t=f({from:"cn",to:"tw"})(e),{success:!0,data:t}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function g(r){try{const e=r.text,o=r.mode||"upper";if(!e)return{success:!1,error:"请输入文本内容"};let t;switch(o){case"upper":t=e.toUpperCase();break;case"lower":t=e.toLowerCase();break;case"capitalize":t=e.replace(/\b\w/g,s=>s.toUpperCase());break;case"sentence":t=e.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,s=>s.toUpperCase());break;case"alternating":t=e.split("").map((s,n)=>n%2===0?s.toLowerCase():s.toUpperCase()).join("");break;default:t=e}return{success:!0,data:t}}catch(e){return{success:!1,error:`转换失败: ${e.message}`}}}async function d(r){try{const e=r.text,o=r.mode||"exact";if(!e)return{success:!1,error:"请输入文本内容"};const t=e.split(`
`),s=t.length;let n;switch(o){case"exact":{const c=new Set,a=[];for(const i of t)c.has(i)||(c.add(i),a.push(i));n=a.join(`
`);break}case"blank":{n=t.filter(a=>a.trim()!=="").join(`
`);break}case"sort":{const c=[...new Set(t)];c.sort(),n=c.join(`
`);break}default:n=e}const l=n.split(`
`),u=s-l.length;return{success:!0,data:`${n}

--- 去重统计 ---
原始行数: ${s}
去重后行数: ${l.length}
移除行数: ${u}`}}catch(e){return{success:!1,error:`去重失败: ${e.message}`}}}export{g as caseConverter,h as textCounter,d as textDedup,m as traditionalSimplified};
