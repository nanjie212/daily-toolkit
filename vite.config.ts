import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from "vite-tsconfig-paths";

// 站点绝对地址：用于把必须「绝对 URL」的 OG / Twitter 元信息注入 HTML。
// 当前托管在 CloudStudio（见 README / PROJECT_DOCUMENT.md），临时域名如下；
// 生产域名确定后，用仓库根目录 .env 里的 VITE_SITE_URL 覆盖即可，无需改代码。
const DEFAULT_SITE_URL = 'https://6c9131a380b24cd08741384565831c9b.bj9.agentos-app.net';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/$/, '');

  // 在 HTML 构建期把 %VITE_SITE_URL% 占位符替换为部署绝对地址，
  // 让 og:image / og:url / twitter:image 等元信息在任意域名下都保持绝对 URL。
  const siteUrlHtmlPlugin = (): Plugin => ({
    name: 'site-url-html',
    enforce: 'pre',
    transformIndexHtml(html: string) {
      return html.replace(/%VITE_SITE_URL%/g, siteUrl);
    },
  });

  // 按根路径 '/' 托管。历史上这里是 '/daily-toolkit/'（GitHub Pages 子路径场景），
  // 但当前托管方（CloudStudio）把 dist 挂在根目录，真实资源位于 /assets/*。
  // 若保留子路径前缀，index.html 会去请求 /daily-toolkit/assets/*.js —— 该路径
  // 在服务器上不存在，被网关的 SPA 回退返回 index.html（text/html），
  // 浏览器把 HTML 当 JS 执行 → 整站白屏。
  // 注：路由用的是 HashRouter（见 src/App.tsx），不依赖 base，故此改动不影响路由；
  // 同时也让 workbox 的 navigateFallback:'/index.html' 与 public/manifest.json
  // 里的 start_url:'/' 恢复自洽（这两处此前就是根路径写法）。
  return {
    base: '/',
  define: {
    __APP_VERSION__: JSON.stringify('1.2.1'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
  },
  plugins: [
    siteUrlHtmlPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '普通日常工具箱',
        short_name: '普通工具箱',
        description: '本地优先的日常工具箱，无需注册，隐私保护',
        theme_color: '#00E5A0',
        background_color: '#0A0A0F',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__.*$/],
      },
    }),
    tsconfigPaths()
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'lucide': ['lucide-react'],
          'opencc': ['opencc-js'],
          'qrcode': ['qrcode'],
          'jszip': ['jszip'],
          'modern-gif': ['modern-gif'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'zustand'],
        },
      },
    },
  },
  server: {
    host: true,
  },
  };
})
