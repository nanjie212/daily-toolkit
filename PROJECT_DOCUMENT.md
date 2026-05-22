# 普通日常工具箱 - 项目文档

> 部署地址：https://daily-toolkit.pages.dev
> 技术栈：React 18 + TypeScript + Tailwind CSS 3 + Vite + Zustand + React Router DOM
> 部署平台：Cloudflare Pages（从 GitHub main 分支自动构建）

---

## 一、项目概述与初始想法

### 1.1 项目定位
一个面向普通用户的**本地优先**日常工具箱网页应用，所有数据仅保存在浏览器 localStorage，零后端依赖。用户无需注册登录即可使用 70+ 实用工具。

### 1.2 核心理念
- **一页展示所有工具**：使用图标网格方案，鼠标悬停显示工具介绍，支持固定/收藏/搜索
- **零隐私担忧**：所有计算、处理均在本地浏览器完成，数据不上传任何服务器
- **离线可用**：通过 PWA Service Worker 支持离线访问
- **即开即用**：无需安装，浏览器打开即可使用

---

## 二、功能需求汇总

### 2.1 工具列表（70+ 工具，8 大分类）

#### 图片处理（image）
| 工具 ID | 工具名称 | 功能说明 |
|---------|---------|---------|
| image-compress | 图片压缩 | 压缩 JPEG/PNG 图片体积 |
| image-convert | 格式转换 | 图片格式互转（PNG/JPEG/WebP/BMP） |
| image-resize | 调整尺寸 | 按比例或自定义尺寸缩放图片 |
| id-photo | 证件照制作 | 一键生成标准证件照 |
| image-watermark | 图片加水印 | 为图片添加文字或图片水印 |
| image-watermark-remove | 去水印 | 涂抹去除图片水印 |
| image-stitch | 图片拼接 | 横向或纵向拼接多张图片 |
| image-ocr | 图片转文字 | OCR 识别图片中的文字 |
| image-to-pdf | 图片转PDF | 多张图片合成 PDF |
| screenshot-annotate | 截图标注 | 截图并添加箭头/文字/涂鸦标注 |
| image-crop | 图片裁剪 | 自由裁剪图片区域 |
| image-grayscale | 灰度处理 | 图片转为黑白灰度效果 |
| image-mirror | 图片镜像 | 水平或垂直镜像翻转 |
| image-rounded-corners | 圆角处理 | 为图片添加圆角效果 |
| image-brightness-contrast | 亮度对比度 | 调节图片亮度和对比度 |

#### 神奇工具（fun/magic）
| 工具 ID | 工具名称 | 功能说明 |
|---------|---------|---------|
| photo-restore | 老照片修复 | 去黄褪色、对比度增强、USM 锐化 |
| ai-bg-remove | AI 一键抠图 | 基于颜色距离的背景移除 + 边缘羽化 |
| text-to-handwriting | 文字转手写体 | 生成逼真手写笔记效果 |
| word-cloud | 词云生成器 | 文本词频统计 + 螺旋布局词云图 |
| pixel-art | 像素画生成 | 照片转 8-bit 像素风格 |
| photo-sketch | 照片转素描 | Sobel 边缘检测素描效果 |
| led-marquee | 手持弹幕 | 全屏 LED 滚动弹幕 HTML |
| lucky-wheel | 抽奖转盘 | 可互动旋转的抽奖转盘 HTML |

#### PDF 处理
| 工具 ID | 工具名称 | 功能说明 |
|---------|---------|---------|
| pdf-split | PDF 拆分 | 按页码拆分 PDF |
| pdf-sign | PDF 签名 | 在 PDF 指定位置添加签名图片 |
| pdf-compress | PDF 压缩 | 压缩 PDF 文件体积 |
| pdf-encrypt | PDF 加密 | 为 PDF 设置密码保护 |
| pdf-decrypt | PDF 解密 | 移除 PDF 密码 |
| pdf-permissions | PDF 权限设置 | 设置打印/复制/修改权限 |
| image-table-to-excel | 图片表格转Excel | OCR 识别图片表格导出 Excel |
| pdf-to-word | PDF 转 Word | 提取 PDF 文字内容为 Word/TXT |

#### 文本处理（document）
| 工具 ID | 工具名称 |
|---------|---------|
| text-counter | 文本统计 |
| traditional-simplified | 繁简转换 |
| case-converter | 大小写转换 |
| text-dedup | 文本去重 |
| text-summary | 文章摘要 |

#### AI 工具
| 工具 ID | 工具名称 |
|---------|---------|
| text-translate | 文本翻译 |
| text-summary | 文章摘要 |
| speech-to-text | 语音转文字 |
| text-to-speech | 文字转语音 |
| e-signature | 电子签名 |

#### 生活工具（life）
| 工具 ID | 工具名称 |
|---------|---------|
| qrcode-generator | 二维码生成 |
| unit-converter | 单位换算 |
| discount-calc | 折扣计算器 |
| pet-age-calc | 宠物年龄换算 |
| weighted-score-calc | 加权成绩计算 |
| clothing-size-converter | 尺码换算 |
| period-tracker-calc | 生理周期计算 |
| random-decision | 随机选择器 |
| lucky-draw | 抽奖工具 |
| pomodoro-timer | 番茄钟 |
| timezone-converter | 时区转换 |
| password-generator | 密码生成器 |
| sensitive-mask | 敏感词遮盖 |
| simple-calculator | 简单计算器 |
| stopwatch | 秒表 |
| countdown | 倒计时 |
| exchange-rate | 汇率换算 |

#### 金融工具（finance）
| 工具 ID | 工具名称 |
|---------|---------|
| social-insurance-calc | 社保计算器 |
| savings-interest-calc | 储蓄利息计算 |
| early-repayment-calc | 提前还款计算 |
| year-end-bonus-tax-calc | 年终奖税务计算 |
| investment-return-calc | 投资回报计算 |
| car-tax-calc | 购车税费计算 |

#### 健康工具（health）
| 工具 ID | 工具名称 |
|---------|---------|
| calorie-calc | 卡路里计算 |
| due-date-calc | 预产期计算 |
| body-fat-calc | 体脂率计算 |
| bmr-calc | 基础代谢率 |
| heart-rate-zone-calc | 心率区间计算 |

#### 日期工具（datetime）
| 工具 ID | 工具名称 |
|---------|---------|
| working-days-calc | 工作日计算 |
| lunar-calendar-query | 农历查询 |
| zodiac-query | 生肖星座查询 |
| anniversary-tracker | 纪念日追踪 |

#### 编码/身份工具
| 工具 ID | 工具名称 |
|---------|---------|
| base64-encode | Base64 编解码 |
| id-card-parser | 身份证号解析 |
| number-to-chinese | 数字转中文大写 |

#### 趣味工具（fun）
| 工具 ID | 工具名称 |
|---------|---------|
| what-to-eat | 今天吃什么 |
| fancy-text-generator | 花体字生成器 |
| special-symbols | 特殊符号大全 |
| kinship-calculator | 亲戚称呼计算器 |
| idiom-chain | 成语接龙（含游戏模式） |
| meme-text-generator | 表情包文字生成 |
| fraction-calculator | 分数计算器 |

### 2.2 侧边栏功能
- 使用时统计（今日/本周分钟数）
- 社区留言板
- 开发者中心
- 隐私保护说明 + 主题切换

### 2.3 交互功能
- **图标网格展示**：一屏展示所有工具，每页 4-12 列自适应
- **悬停预览**：鼠标悬停 300ms 后显示工具详情弹窗
- **固定/收藏**：Pin 图标固定到顶部，Star 收藏标记
- **分类筛选**：水平滚动分类标签
- **搜索**：实时搜索工具名称和描述
- **主题切换**：日间/夜间模式
- **新手引导**：首次访问弹窗引导

---

## 三、技术架构

### 3.1 目录结构
```
src/
├── components/       # UI 组件
│   ├── Sidebar.tsx          # 侧边栏
│   ├── ToolGrid.tsx         # 工具图标网格
│   ├── ToolCard.tsx         # 工具卡片
│   ├── ToolDetail.tsx       # 工具详情
│   ├── DynamicForm.tsx      # 动态表单
│   ├── OutputPanel.tsx      # 输出面板
│   ├── ThemeToggle.tsx      # 主题切换
│   ├── Layout.tsx           # 布局框架
│   ├── IdiomChainGame.tsx   # 成语接龙游戏
│   ├── IdiomChainGame.tsx   # 增强抠图
│   ├── EnhancedPhotoRestorer.tsx # 增强老照片修复
│   ├── ...                  # 其他组件
├── pages/            # 页面
│   ├── Home.tsx             # 主页（图标网格）
│   ├── ToolWorkspace.tsx    # 工具工作区
│   ├── Community.tsx        # 社区留言板
│   ├── Developer.tsx        # 开发者中心
│   └── Market.tsx           # 工具市场
├── store/            # 状态管理 (Zustand)
│   └── index.ts             # 全局状态
├── tools/            # 工具定义与实现
│   ├── index.ts             # 工具索引
│   ├── categories.ts        # 分类定义
│   ├── *.ts                 # 各分类工具定义
│   └── implementations/     # 工具实现
├── engine/           # 引擎
│   ├── ToolExecutor.ts      # 工具执行器（懒加载）
│   └── ToolLoader.ts        # 工具加载器
├── lib/              # 工具库
│   └── safeStorage.ts       # localStorage 安全封装
└── types/            # 类型定义
    └── index.ts             # 全局类型
```

### 3.2 数据流
```
用户点击工具 → Router → ToolWorkspace
  → DynamicForm 渲染输入表单
  → 用户填写参数并提交
  → ToolExecutor.executeTool(id, input)
    → 动态 import 工具实现模块
    → 调用具体函数
    → 返回 ToolOutput
  → OutputPanel 渲染结果
  → 记录使用历史到 localStorage
```

### 3.3 状态管理（Zustand Store）
```
ToolBoxState:
  tools, categories         # 工具和分类数据
  recentToolIds             # 最近使用(最多10个)
  favoriteToolIds           # 收藏列表
  pinnedToolIds             # 固定列表
  searchQuery               # 搜索关键词
  selectedCategory          # 当前选中分类
  selectedTool              # 当前选中工具
  theme                     # 主题 dark/light
  toolLikes, toolFeedbacks  # 互动数据
```

### 3.4 主题系统
- 暗色模式为默认（`:root` CSS 变量）
- 亮色模式通过 `html.light` class 覆盖
- CSS 变量: `--bg`, `--card`, `--surface`, `--text`, `--accent` 等
- Tailwind 自定义工具类: `bg-bg`, `bg-card`, `bg-surface`, `text-accent` 等

---

## 四、开发与修复历史

### 4.1 第1轮：首页重新设计
- **问题**：原有布局太乱，难以一目了然看到所有工具
- **方案**：图标网格方案，一屏展示所有工具
- **改动**：ToolGrid 组件，图标代表工具、悬停显示介绍、支持固定图标
- **状态**：✅ 完成

### 4.2 第2轮：折扣计算器增强
- **需求**：增加更多商家折扣套路
- **改动**：从单一折扣支持 9 种商家套路（满减、第二件半价、买N送一等）
- **状态**：✅ 完成

### 4.3 第3轮：部署到 Cloudflare Pages
- **需求**：从 GitHub main 分支自动部署到 Cloudflare Pages
- **域名**：daily-toolkit.pages.dev
- **状态**：✅ 完成

### 4.4 第4轮：5个工具功能修复
- AI 一键抠图：✅ 修复
- 老照片修复：✅ 增强（去黄褪色→降噪→对比度→USM锐化）
- 词云生成器：✅ 加强（螺旋布局+碰撞检测+4色系）
- 语音转文字：✅ 优化（独立HTML页面）
- PDF 加密：✅ 修复（pdf-lib 1.17.1 API 兼容）

### 4.5 第5轮：6大功能优化
1. 成语接龙玩法优化：✅ 换词(3次/日)、音效、今日挑战(5关)、徽章
2. 侧边栏调整：✅ 删除分类导航，保留4个模块
3. PDF加密报错修复：✅ encrypt API 兼容
4. AI抠图效果优化：✅ 阈值调节、边缘羽化、手动修正画笔
5. 老照片修复补充：✅ 三档强度、四种上色风格
6. 构建部署：✅ 完成

### 4.6 第6轮：4个紧急Bug修复
1. 侧边栏显示异常：✅ justify-end → justify-start
2. 二级页面无返回：✅ 添加 ArrowLeftIcon 返回按钮
3. 主题模式显示问题：✅ 添加12组CSS覆盖规则
4. 顶部功能区优化：✅ 增大间距和字号

### 4.7 TypeScript 错误修复（最新）
| 文件 | 错误数 | 修复方式 |
|------|--------|---------|
| types/index.ts | 2 | 添加 `rows` 到 InputField，`type` 到 ToolOutput |
| store/index.ts | 3 | 接口添加 `pinnedToolIds` 和 `togglePinned` |
| Home.tsx | 1 | `as tools` → `as ToolRecord[]`，添加类型导入 |
| IdiomChainGame.tsx | 11 | 定义 `IdiomChainData` 接口，修复 getJSON 泛型调用 |
| funTools.ts | 15 | 合并15处成语重复键，修复 ToolOutput type 字段 |
| pdfTools.ts | 4 | pdf-lib 类型断言(as any) |
| magic.ts | 3 | InputField 添加 rows 字段 |
| ToolGrid.tsx | 4 | Store 接口修复后自动解决 |

---

## 五、网页改进建议

### 5.1 功能优化（高优先级）

#### 5.1.1 搜索支持拼音
- **现状**：仅支持工具名称和描述的中文精确匹配
- **建议**：引入拼音库（如 pinyin-pro），让用户可以用拼音首字母搜索工具
- **示例**：输入 "tps" → 搜索到 "图片压缩"、"图片拼接" 等

#### 5.1.2 工具使用统计增强
- **现状**：仅显示今日/本周使用分钟数
- **建议**：
  - 添加工具使用频次排行榜（本周最常用的5个工具）
  - 添加使用趋势图（近7天使用时长柱状图）
  - 添加"发现新工具"推荐（未使用过的工具）

#### 5.1.3 社区留言板增加后端
- **现状**：所有留言仅保存在本地，不同用户无法看到彼此留言
- **建议**：接入轻量后端（如 Supabase/Firebase），实现真正的社区互动

#### 5.1.4 工具市场实际运作
- **现状**：工具市场的"安装"只是复制到本地列表，无法真正从社区下载新工具
- **建议**：
  - 短期：移除工具市场页面，避免用户困惑
  - 长期：构建工具市场后端，支持社区上传自定义工具

### 5.2 用户体验优化（中优先级）

#### 5.2.1 移动端适配完善
- **现状**：ToolGrid 在手机上4列显示，部分按钮 touch 区域可能过小
- **建议**：
  - 手机上改为3列，增大 hit area 到至少 44x44px
  - ToolPreviewCard 在手机上改为底部弹出式，而非悬浮
  - 侧边栏在手机上改为底部导航栏（现已有 MobileNav 组件，可检查其完善度）

#### 5.2.2 主题切换动画
- **现状**：主题切换瞬间变化，没有过渡动画
- **建议**：使用 CSS `transition` 在 `background-color` 和 `color` 上添加 0.3s 平滑过渡

#### 5.2.3 图片处理进度反馈
- **现状**：图片处理（压缩、修复等）期间仅显示通用加载 spinner
- **建议**：添加真实的进度条（Canvas 处理时可按步骤报告进度）

#### 5.2.4 收藏/固定功能 UI 强化
- **现状**：收藏和固定的图标在工具卡片角落，比较小（w-3 h-3）
- **建议**：增大标记图标，添加操作反馈动画

### 5.3 技术优化（低优先级）

#### 5.3.1 代码分割优化
- **现状**：所有工具通过动态 import 懒加载，但部分 chunk 仍然较大
- **建议**：
  - pdfTools 编译后 441KB，可进一步拆分
  - opencc 1.1MB，仅在极小概率使用，可改为 CDN 远程加载
  - xlsx 429KB，可改为 CDN 加载

#### 5.3.2 PWA 离线体验提升
- **现状**：已注册 Service Worker 但离线页面可能不完整
- **建议**：配置 Custom offline page，提供离线时的友好提示和缓存工具列表

#### 5.3.3 构建优化
- **现状**：`npm run build` 约10秒，包含大量 `empty chunk` 警告
- **建议**：在 vite.config 中配置 `build.rollupOptions.output.manualChunks` 优化分包
- **现状**：移动端 4 列时小众图标可能显示 qr 码等信息，建议保持按类显示的粒度。

#### 5.3.4 TypeScript 严格模式
- **现状**：`tsconfig.json` 可能未启用严格模式
- **建议**：启用 `strict: true` 以获得更全面的类型安全检查

### 5.4 内容与合规

#### 5.4.1 添加使用条款和隐私政策
- **现状**：侧边栏有"隐私保护说明"但无正式文档
- **建议**：在页面底部添加简短的隐私声明和免责条款

#### 5.4.2 赞赏码支持
- **现状**：DonateSection 组件接受 `wechatQr` 和 `alipayQr` 但代码中为空字符串
- **建议**：如果您愿意，可以上传实际的赞赏码图片

### 5.5 值得关注的前沿方向

#### 5.5.1 本地 AI 模型
- **WebLLM / Web Stable Diffusion**：浏览器端运行小型 AI 模型
- **Transformers.js**：纯浏览器端 NLP，无需后端
- 适合集成到本工具箱的功能：本地翻译、本地 OCR 增强、智能推荐

#### 5.5.2 WebAssembly 加速
- 图像处理（如锐化、缩放）可用 WASM 实现，性能提升 3-5 倍
- PDF 解析也可通过 WASM 获得更好的性能

#### 5.5.3 PWA 进阶
- File System Access API：允许直接编辑本地文件
- Background Sync：离线时缓存操作，在线后自动执行
- Web Share API：更方便地分享工具结果

---

## 六、本地开发指南

### 6.1 环境要求
- Node.js >= 18
- npm >= 9

### 6.2 启动开发
```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
```

### 6.3 构建部署
```bash
npm run build      # 构建到 dist/
npm run preview    # 预览构建结果
npm run check      # TypeScript 类型检查
npm run lint       # ESLint 检查
npm run deploy     # 构建 + 部署到 GitHub Pages
```

### 6.4 添加新工具
1. 在 `src/tools/implementations/` 中实现执行函数（返回 `ToolOutput`）
2. 在 `src/tools/` 的对应分类文件中添加工具定义（`ToolRecord`）
3. 在 `src/engine/ToolExecutor.ts` 注册懒加载映射
4. 在 `src/components/ToolGrid.tsx` 的 `iconMap` 中注册图标（如果使用新图标）

---

## 七、已知问题

| 问题 | 原因 | 建议方案 |
|------|------|---------|
| 主题切换可能需手动刷新 | CSS `!important` 覆盖存在缓存 | 无运行时问题，可忽略 |
| PDF 加密不支持某些浏览器 | pdf-lib 加密 API 兼容性问题 | 提示用户使用 Chrome/Edge |
| 成语接龙UI在手机上可能布局异常 | IdiomChainGame 使用固定宽 `max-w-2xl` | 改为响应式布局 |
| 社区留言仅本地保存 | 无后端支持 | 如需真社区功能需接入后端 |
| 工具市场的工具也是内置的 | 市场功能未完成 | 考虑暂时隐藏该页面 |
| Cloudflare 部署需2-3分钟 | 平台构建队列 | 等待自动部署完成 |

---

## 八、最后总结

### 已完成的核心能力
- 70+ 实用工具覆盖日常生活常用场景
- 纯前端、零后端、隐私安全的本地处理
- 美观的图标网格界面 + 悬停预览交互
- 完整的主题切换系统
- PWA 离线支持
- 成语接龙等互动游戏功能
- 图片处理、PDF处理、文字处理等功能完整

### 项目定位
这个工具箱的设计初衷是 "一个网页解决日常小问题"，目前已经达到了"常见需求一站式解决"的目标。所有工具均可在浏览器内独立运行，无需安装任何软件，无需注册账号，非常适合作为日常实用工具的集合入口。