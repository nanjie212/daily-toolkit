# 🚀 部署指南

## 方法一：GitHub Actions 自动部署 (推荐)

### 步骤 1：在 GitHub 上启用 GitHub Pages

1. 打开你的 GitHub 仓库：https://github.com/nanjie212/daily-toolkit
2. 点击 **Settings** (设置)
3. 左侧菜单选择 **Pages**
4. **Source** 选择 **GitHub Actions**
5. 保存

### 步骤 2：推送代码到 GitHub

由于沙箱环境无法直接 push，你需要在本地执行：

```bash
# 克隆仓库到本地
git clone https://github.com/nanjie212/daily-toolkit.git
cd daily-toolkit

# 或者如果你已经有本地仓库
git pull origin main

# 将沙箱中的修改复制过来，然后提交
# ...复制文件...

git add -A
git commit -m "feat: 全新图标网格首页 + 折扣计算器增强 + Bug修复"
git push origin main
```

### 步骤 3：等待自动部署

推送后，GitHub Actions 会自动：
1. 安装依赖
2. 构建项目
3. 部署到 GitHub Pages

部署完成后，访问地址：**https://nanjie212.github.io/daily-toolkit/**

---

## 方法二：手动部署

### 步骤 1：本地构建

```bash
npm install
npm run build
```

### 步骤 2：使用 gh-pages 部署

```bash
# 安装 gh-pages (已添加到 package.json)
npm install -g gh-pages

# 部署 dist 文件夹
gh-pages -d dist
```

---

## 📋 本次更新内容

### ✨ 新功能
- **全新图标网格首页**：一屏展示所有工具，一目了然
- **悬停预览**：鼠标悬停显示工具详情
- **固定工具**：常用工具可固定到顶部
- **折扣计算器增强**：支持9种商家折扣套路

### 🐛 Bug 修复
- 修复 `t.replace is not a function` 错误
- 修复滚动位置保持问题

### 📁 修改的文件
- `src/pages/Home.tsx` - 全新首页
- `src/components/ToolGrid.tsx` - 新增图标网格组件
- `src/store/index.ts` - 添加固定工具功能
- `src/tools/implementations/lifeUtilityTools.ts` - 折扣计算器增强
- `vite.config.ts` - 配置 GitHub Pages base 路径
- `.github/workflows/deploy.yml` - 自动部署工作流

---

## 🔗 访问地址

部署成功后，网站将可以通过以下地址访问：

**https://nanjie212.github.io/daily-toolkit/**

---

## ❓ 常见问题

### Q: 部署后页面空白？
A: 检查 vite.config.ts 中的 `base: '/daily-toolkit/'` 是否正确配置

### Q: 资源加载 404？
A: 确保所有资源路径使用相对路径，vite 会自动处理

### Q: 如何更新网站？
A: 只需推送新的 commit 到 main 分支，GitHub Actions 会自动重新部署

---

## 📞 需要帮助？

如有问题，请在 GitHub 仓库提交 Issue 或查看 Actions 日志。
