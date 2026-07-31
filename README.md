# 普通日常工具箱

🌐 **在线使用（WorkBuddy 云端）：** https://6c9131a380b24cd08741384565831c9b.bj9.agentos-app.net

> 站点部署在 WorkBuddy 云端工作空间（CloudStudio，腾讯云节点），国内访问稳定，关电脑也照常在线。

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

## 开发与部署（WorkBuddy 云端，无需 GitHub）

本项目**完全在 WorkBuddy 云端环境中开发并发布**，不依赖 GitHub 或其他第三方代码托管平台：

- **开发**：通过 WorkBuddy（桌面端 / 移动端 App）把需求告诉云端代理，由代理在云端完成编码、构建与发布。
- **托管**：构建产物由 WorkBuddy 云端工作空间（CloudStudio）静态托管，手机浏览器直接打开上面的在线地址即用。
- **关电脑续操作**：站点本身在云端运行，关机照常在线；需要改功能时，用手机打开 WorkBuddy App 提需求，代理在云端改完即重新发布。

> 说明：本地 `npm run dev` 仍可用于本机调试，但正式发布统一走 WorkBuddy 云端，不再使用 GitHub Pages / `npm run deploy`。
