# 普通日常工具箱

🌐 **在线使用：** https://nanjie212.github.io/daily-toolkit/

本地优先的纯前端工具集合网站。无需注册、零数据上传、可完全离线运行，永久免费。

## 特性
- **66 个实用工具**，覆盖日常、图片、趣味、金融、健康等分类
- **100% 浏览器内运行**，隐私优先，不上传任何数据
- **PWA 支持**，可安装到桌面 / 手机主屏，离线也能用

## 技术栈
React 18 · TypeScript · Vite 6 · Tailwind CSS 3 · Zustand

## 本地开发
```bash
npm install
npm run dev
```

## 部署
```bash
npm run deploy   # 自动构建并发布到 GitHub Pages（gh-pages 分支），已配置 SSH，无需 token
```

> 部署前请先确认 `ssh -T git@github.com` 返回成功（已通过 SSH over HTTPS/443 配置，绕开 22 端口封锁）。
