# 日常工具箱 - 发展规划（第一阶段 + 第二阶段）

> 本文档为「日常工具箱」的未来阶段性发展规划。
> **核心理念：99% 本地化运行，用户数据不上传任何服务器。**
> 所有工具在浏览器内独立完成计算，仅在社区留言板等明确需要社交互动的地方使用云端存储。

---

## 第一阶段：打磨与优化（短期 1-2 周）

**目标**：提升现有功能的完成度、用户体验和性能，无需新增重大功能。

### 1.1 拼音搜索支持

**现状问题**：搜索仅支持工具名称和描述的中文精确匹配，输入拼音首字母无法搜到对应工具。

**方案**：
- 引入轻量拼音库 `pinyin-pro`（约 20KB gzip）
- 在搜索逻辑中添加拼音转换匹配
- 支持全拼和首字母两种模式

**实现要点**：
```typescript
function searchTools(query: string, tools: ToolRecord[]) {
  const pinyinQuery = pinyin(query, { toneType: 'none' });
  const initialQuery = pinyin(query, { pattern: 'first' });
  return tools.filter(t => {
    const nameMatch = t.name.includes(query);
    const descMatch = t.description.includes(query);
    const pinyinMatch = pinyin(t.name).includes(pinyinQuery);
    const initialMatch = pinyin(t.name, { pattern: 'first' }).includes(initialQuery);
    return nameMatch || descMatch || pinyinMatch || initialMatch;
  });
}
```

**涉及文件**：`src/components/ToolGrid.tsx`（搜索逻辑）
**预估工时**：2-3 小时

### 1.2 构建体积优化

**现状问题**：
- `index.js` = ~400KB（主入口，含部分 unused 代码）
- OpenCC 库极少使用但体积较大

**方案**：
- OpenCC CDN 化：通过动态 `<script>` 标签加载，减少主包体积
- 检查各工具实现中的 Tree-shaking 机会

**涉及文件**：`vite.config.ts`
**预估工时**：2-3 小时

### 1.3 主题切换动画

**现状问题**：切换日间/夜间模式时瞬间变化，没有过渡动画。

**方案**：
```css
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

**涉及文件**：`src/index.css`、`src/components/ThemeToggle.tsx`
**预估工时**：1-2 小时

### 1.4 移动端预览弹窗

**现状问题**：工具预览卡片在手机上悬浮显示，在小屏幕上可能超出视口。

**方案**：
- 手机端（`< md`）改为底部弹出式（bottom sheet）效果
- 桌面端保持悬浮显示

**涉及文件**：`src/components/ToolGrid.tsx`
**预估工时**：2-3 小时

### 1.5 分类标签滚动体验

**现状问题**：分类标签横向滚动的触摸体验不够流畅。

**方案**：
- 添加 CSS `-webkit-overflow-scrolling: touch`
- 添加触摸拖拽手势支持
- 增大标签触摸区域至 44px min-height

**涉及文件**：`src/pages/Home.tsx`
**预估工时**：1-2 小时

---

## 第二阶段：社区互动（中期 2-3 周）

**目标**：实现社区留言板上云存储，让用户之间可以互动，同时保持工具本身的完全本地化。

### 2.1 社区留言板接入 Supabase（已完成代码）

**现状**：留言板仅本地存储，不同用户无法看到彼此留言。

**方案**：使用 Supabase 免费层实现云端存储，已全部实现：
- ✅ `.env.example` 配置模板已创建（含 Supabase 项目创建指引）

**部署时需要您做的（仅需 5 分钟）：**
1. 访问 [supabase.com](https://supabase.com) 注册免费账号
2. 创建一个新项目（选 Free 套餐即可）
3. 创建后在 SQL Editor 中运行 `supabase-migration.sql`
4. 在项目设置 → API 中复制 `Project URL` 和 `anon public key`
5. 粘贴到 Cloudflare Pages → 环境变量（`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）
6. 重新部署 - 留言板自动启用云端同步

**实现方式**：双模式存储
- 配置了 Supabase → 留言云端同步，所有用户可见
- 未配置 Supabase → 留言仅保存在本地（现有行为不变）
- 用户数据（昵称等）始终保存在本地，不上传

**安全说明**：
- Supabase 使用 Row Level Security，用户只能读写留言数据
- 用户自身信息（昵称、偏好等）始终存储在本地，不传入云端
- 不涉及任何用户身份认证系统
- ✅ `@supabase/supabase-js` 客户端已安装
- ✅ `src/lib/supabase.ts` 存储层已创建
- ✅ `src/pages/Community.tsx` 已更新支持双模式
- ✅ SQL 迁移脚本已准备（`supabase-migration.sql`）
- ✅ `.env.example` 配置模板已创建

---

## 实施优先级建议

### 第1周
| 序号 | 任务 | 预估工时 | 优先级 |
|------|------|---------|--------|
| 1.1 | 拼音搜索 | 2-3h | ⭐⭐⭐⭐⭐ |
| 1.4 | 移动端预览弹窗 | 2-3h | ⭐⭐⭐⭐ |
| 1.3 | 主题切换动画 | 1-2h | ⭐⭐⭐ |

### 第2周
| 序号 | 任务 | 预估工时 | 优先级 |
|------|------|---------|--------|
| 1.2 | 构建体积优化（OpenCC CDN） | 2-3h | ⭐⭐⭐⭐ |
| 1.5 | 分类标签滚动体验 | 1-2h | ⭐⭐⭐ |
| 2.1 | **部署社区留言板上云**（已就绪） | 5min | ⭐⭐⭐⭐⭐ |

### 第3-4周
| 序号 | 任务 | 预估工时 | 优先级 |
|------|------|---------|--------|
| 2.1 | 社区留言板云端运维（可选） | - | ⭐⭐⭐ |
| 数据导出导入 | 防浏览器清除丢失 | 3-4h | ⭐⭐⭐ |

---

## 技术债务清理清单

| 任务 | 说明 | 优先级 |
|------|------|--------|
| JSON 导出/导入用户数据 | 防止浏览器清除后丢失 | 中 |
| 迁移到 TypeScript strict 模式 | 目前未启用 `strict: true` | 低 |
| PWA 离线页面增强 | 配置 custom offline page | 低 |

---

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| Supabase 免费层限制 | 低 | 中 | 预留自建方案；使用缓存减少 API 调用 |
| 社区工具安全风险 | 中 | 高 | 代码沙箱执行（iframe sandbox）；仅允许纯函数 |
| 拼音库体积过大 | 低 | 低 | `pinyin-pro` 仅 20KB gzip |
| OpenCC CDN 加载失败 | 低 | 低 | 添加 loading fallback + 错误重试 |
| 主题过渡动画性能 | 低 | 低 | 仅对 `background-color` 和 `color` 使用 transition，不影响布局 |

---

> 本文档为规划方案，任务标记为「待实施」，准备好后可按阶段逐项推进。