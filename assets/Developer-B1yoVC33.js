import{j as e}from"./index-Di389DQz.js";import{r as s,h as C}from"./vendor-CR0zKoQR.js";import{aG as k,l as j,w as N,t as v,N as T,b as O,e as I,S as E,ap as F}from"./lucide-B6ZXsKn3.js";import"./qrcode-DpynCwP9.js";function D(){const[a,r]=s.useState(""),[i,h]=s.useState(""),[u,p]=s.useState(""),[x,n]=s.useState(""),[d,g]=s.useState(!1),[c,f]=s.useState(null),y=()=>{if(!a.trim())return;const t=a.slice(0,20).replace(/\s+/g,"-"),l=`你是一个工具开发助手。请根据以下描述生成一个ToolBox工具：

工具描述：${a}

请生成：
1. 工具的名称、描述和分类
2. 输入参数定义（inputSchema）
3. 输出格式说明
4. 执行逻辑的伪代码

要求：
- 工具ID使用kebab-case命名
- 输入参数类型支持：text, textarea, file, select, number, checkbox, color
- 输出格式为ToolOutput接口
- 代码使用TypeScript`;h(l);const b=JSON.stringify({id:t,name:a.slice(0,10),description:a,category:"custom",icon:"CodeIcon",version:"1.0.0",source:"custom",permissions:[],inputSchema:[{key:"input",label:"输入",type:"textarea",placeholder:"请输入...",required:!0}],outputFormat:"text"},null,2);p(b);const o=`import type { ToolOutput } from '@/types';

export async function execute(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.input as string;
    if (!text) return { success: false, error: '请输入内容' };

    // TODO: 在此实现 ${a.slice(0,10)} 的核心逻辑
    const result = text;

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}`;n(o),g(!1)},m=(t,l)=>{navigator.clipboard.writeText(t),f(l),setTimeout(()=>f(null),2e3)};return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"描述你想要的工具"}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("textarea",{value:a,onChange:t=>r(t.target.value),placeholder:"例如：一个可以将CSV数据转换为JSON格式的工具...",rows:3,className:"flex-1 px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all resize-none"}),e.jsxs("button",{onClick:y,disabled:!a.trim(),className:"px-5 py-2.5 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap",children:[e.jsx(k,{className:"w-4 h-4"}),"生成"]})]})]}),i&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-sm text-gray-400 flex items-center gap-2",children:[e.jsx(k,{className:"w-4 h-4 text-accent"}),"AI提示词"]}),e.jsx("button",{onClick:()=>m(i,"prompt"),className:"p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all",children:c==="prompt"?e.jsx(j,{className:"w-4 h-4"}):e.jsx(N,{className:"w-4 h-4"})})]}),e.jsx("pre",{className:"bg-surface rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto",children:i})]}),e.jsxs("button",{onClick:()=>g(!d),className:"w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2",children:[e.jsx(v,{className:"w-4 h-4"}),"一键集成"]}),d&&e.jsxs("div",{className:"space-y-4 animate-fade-in",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-sm text-gray-400 flex items-center gap-2",children:[e.jsx(T,{className:"w-4 h-4 text-accent"}),"tool.json"]}),e.jsx("button",{onClick:()=>m(u,"json"),className:"p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all",children:c==="json"?e.jsx(j,{className:"w-4 h-4"}):e.jsx(N,{className:"w-4 h-4"})})]}),e.jsx("pre",{className:"bg-surface rounded-xl p-4 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto",children:u})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-sm text-gray-400 flex items-center gap-2",children:[e.jsx(v,{className:"w-4 h-4 text-accent"}),"执行入口"]}),e.jsx("button",{onClick:()=>m(x,"code"),className:"p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all",children:c==="code"?e.jsx(j,{className:"w-4 h-4"}):e.jsx(N,{className:"w-4 h-4"})})]}),e.jsx("pre",{className:"bg-surface rounded-xl p-4 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto",children:x})]}),e.jsxs("div",{className:"bg-surface rounded-xl p-4",children:[e.jsx("h4",{className:"text-white font-medium text-sm mb-3",children:"集成步骤"}),e.jsxs("ol",{className:"space-y-2 text-sm text-gray-400",children:[e.jsxs("li",{className:"flex gap-2",children:[e.jsx("span",{className:"text-accent font-bold",children:"1."}),e.jsx("span",{children:"复制 tool.json 配置到 src/tools/ 目录"})]}),e.jsxs("li",{className:"flex gap-2",children:[e.jsx("span",{className:"text-accent font-bold",children:"2."}),e.jsx("span",{children:"在 src/tools/implementations/ 中创建执行文件"})]}),e.jsxs("li",{className:"flex gap-2",children:[e.jsx("span",{className:"text-accent font-bold",children:"3."}),e.jsx("span",{children:"在 ToolExecutor.ts 中注册执行器"})]}),e.jsxs("li",{className:"flex gap-2",children:[e.jsx("span",{className:"text-accent font-bold",children:"4."}),e.jsx("span",{children:"在工具注册表中导入新工具"})]}),e.jsxs("li",{className:"flex gap-2",children:[e.jsx("span",{className:"text-accent font-bold",children:"5."}),e.jsx("span",{children:"测试工具执行并验证输出结果"})]})]})]})]})]})]})}function P(){const a=C(),[r,i]=s.useState("sdk"),[h,u]=s.useState(`// 在此编写并测试你的工具代码
// 使用 console.log() 输出调试信息

const name = "World";
console.log(\`Hello, \${name}!\`);
`),[p,x]=s.useState(""),[n,d]=s.useState(""),[g,c]=s.useState(!1),f=t=>{navigator.clipboard.writeText(t),c(!0),setTimeout(()=>c(!1),2e3)},y=()=>{x(""),d("");const t=[],l=console.log;try{console.log=(...S)=>{t.push(S.map(w=>typeof w=="object"?JSON.stringify(w):String(w)).join(" "))};const o=new Function(`"use strict"; ${h}`)();o!==void 0&&t.push(`返回值: ${typeof o=="object"?JSON.stringify(o):o}`),x(t.join(`
`)||"执行成功，无输出")}catch(b){d(b.message)}finally{console.log=l}},m=[{id:"sdk",label:"SDK文档",icon:I},{id:"wizard",label:"创建向导",icon:v},{id:"sandbox",label:"沙盒测试",icon:E}];return e.jsxs("div",{className:"min-h-full p-6 lg:p-8 space-y-6",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("button",{onClick:()=>a("/"),"aria-label":"返回",className:"min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all",children:e.jsx(O,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-heading font-bold text-white mb-1",children:"开发者中心"}),e.jsx("p",{className:"text-gray-400",children:"创建、测试和发布你的自定义工具"})]})]}),e.jsx("div",{className:"flex gap-2 border-b border-white/5 pb-0",children:m.map(t=>{const l=t.icon;return e.jsxs("button",{onClick:()=>i(t.id),className:`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${r===t.id?"text-accent border-accent":"text-gray-400 border-transparent hover:text-white"}`,children:[e.jsx(l,{className:"w-4 h-4"}),t.label]},t.id)})}),r==="sdk"&&e.jsx("div",{className:"space-y-6 animate-fade-in",children:e.jsxs("div",{className:"bg-card border border-white/5 rounded-2xl p-6 space-y-6",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-white font-heading font-bold text-xl mb-3",children:"工具定义接口"}),e.jsx("p",{className:"text-gray-400 text-sm mb-3",children:"每个工具需要实现 ToolDefinition 接口，定义工具的基本信息和输入输出格式。"}),e.jsxs("div",{className:"relative",children:[e.jsx("button",{onClick:()=>f(`interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  source: 'builtin' | 'community' | 'custom';
  permissions: string[];
  inputSchema: InputField[];
  outputFormat: string;
}`),className:"absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/10 transition-all z-10",children:g?e.jsx(j,{className:"w-4 h-4"}):e.jsx(N,{className:"w-4 h-4"})}),e.jsx("pre",{className:"bg-surface rounded-xl p-4 text-sm text-gray-300 overflow-x-auto",children:`interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  source: 'builtin' | 'community' | 'custom';
  permissions: string[];
  inputSchema: InputField[];
  outputFormat: string;
}`})]})]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-white font-heading font-bold text-xl mb-3",children:"输入字段定义"}),e.jsx("p",{className:"text-gray-400 text-sm mb-3",children:"支持多种输入类型：text、textarea、file、select、number、checkbox、color"}),e.jsx("pre",{className:"bg-surface rounded-xl p-4 text-sm text-gray-300 overflow-x-auto",children:`interface InputField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'select' | 'number' | 'checkbox' | 'color';
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  accept?: string;
}`})]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-white font-heading font-bold text-xl mb-3",children:"输出格式"}),e.jsx("p",{className:"text-gray-400 text-sm mb-3",children:"工具执行结果遵循统一的 ToolOutput 接口。"}),e.jsx("pre",{className:"bg-surface rounded-xl p-4 text-sm text-gray-300 overflow-x-auto",children:`interface ToolOutput {
  success: boolean;
  data?: unknown;
  error?: string;
  downloadUrl?: string;
  filename?: string;
}`})]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-white font-heading font-bold text-xl mb-3",children:"快速开始"}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("span",{className:"flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center",children:"1"}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white font-medium text-sm",children:"定义工具"}),e.jsx("p",{className:"text-gray-500 text-sm",children:"创建 tool.json 配置文件，定义工具的元信息和输入参数"})]})]}),e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("span",{className:"flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center",children:"2"}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white font-medium text-sm",children:"实现逻辑"}),e.jsx("p",{className:"text-gray-500 text-sm",children:"编写 onExecute 函数，处理输入并返回 ToolOutput"})]})]}),e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("span",{className:"flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center",children:"3"}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white font-medium text-sm",children:"注册工具"}),e.jsx("p",{className:"text-gray-500 text-sm",children:"在 ToolExecutor 中注册执行器，在工具注册表中导入"})]})]}),e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("span",{className:"flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 text-accent text-sm font-bold flex items-center justify-center",children:"4"}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white font-medium text-sm",children:"测试发布"}),e.jsx("p",{className:"text-gray-500 text-sm",children:"使用沙盒测试工具，确认无误后发布到工具市场"})]})]})]})]})]})}),r==="wizard"&&e.jsx("div",{className:"animate-fade-in",children:e.jsxs("div",{className:"bg-card border border-white/5 rounded-2xl p-6",children:[e.jsx("h2",{className:"text-white font-heading font-bold text-xl mb-4",children:"AI提示词生成器"}),e.jsx("p",{className:"text-gray-400 text-sm mb-6",children:"描述你想要的工具，AI将为你生成提示词模板和一键集成代码"}),e.jsx(D,{})]})}),r==="sandbox"&&e.jsxs("div",{className:"animate-fade-in space-y-4",children:[e.jsxs("div",{className:"bg-card border border-white/5 rounded-2xl p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h2",{className:"text-white font-heading font-bold text-xl",children:"沙盒测试"}),e.jsxs("button",{onClick:y,className:"px-4 py-2 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl transition-all flex items-center gap-2",children:[e.jsx(F,{className:"w-4 h-4"}),"运行"]})]}),e.jsx("textarea",{value:h,onChange:t=>u(t.target.value),className:"w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all resize-y min-h-[300px]",spellCheck:!1})]}),(p||n)&&e.jsxs("div",{className:`rounded-2xl p-6 ${n?"bg-red-500/10 border border-red-500/20":"bg-card border border-white/5"}`,children:[e.jsx("h3",{className:`font-medium mb-2 ${n?"text-red-400":"text-white"}`,children:n?"错误":"输出"}),e.jsx("pre",{className:"text-sm whitespace-pre-wrap break-all font-mono text-gray-300",children:n||p})]})]})]})}export{P as default};
