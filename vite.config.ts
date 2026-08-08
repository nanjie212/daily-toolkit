import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from "vite-tsconfig-paths";

// 站点绝对地址：用于把必须「绝对 URL」的 OG / Twitter 元信息注入 HTML。
// 部署时通过仓库根目录 .env 的 VITE_SITE_URL 注入（CloudStudio 部署流程会注入真实域名）。
// 未配置时默认为空字符串：%VITE_SITE_URL% 占位符被替换为空，OG 标签退化为相对路径，
// 不影响站点任何功能。
const DEFAULT_SITE_URL = '';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/$/, '');

  // 部署基础路径：默认 '/'（CloudStudio 把 dist 挂在根目录）。
  // GitHub Pages 项目页需要子路径前缀，构建时用环境变量覆盖：
  //   BASE_PATH=/daily-toolkit/ npx vite build
  // 注意必须以 '/' 结尾，下方 navigateFallback / start_url 依赖这一约定。
  const base = process.env.BASE_PATH || '/';

  // 在 HTML 构建期把 %VITE_SITE_URL% 占位符替换为部署绝对地址，
  // 让 og:image / og:url / twitter:image 等元信息在任意域名下都保持绝对 URL。
  const siteUrlHtmlPlugin = (): Plugin => ({
    name: 'site-url-html',
    enforce: 'pre',
    transformIndexHtml(html: string) {
      return html.replace(/%VITE_SITE_URL%/g, siteUrl);
    },
  });

  // base 由上面的 BASE_PATH 决定，两种托管场景各自自洽：
  // 1) CloudStudio（默认，base='/'）：部署工具把 dist 挂在根目录，真实资源位于 /assets/*。
  //    此时若误用子路径前缀，index.html 会去请求 /daily-toolkit/assets/*.js —— 该路径
  //    在服务器上不存在，被网关的 SPA 回退返回 index.html（text/html），
  //    浏览器把 HTML 当 JS 执行 → 整站白屏。
  // 2) GitHub Pages 项目页（BASE_PATH='/daily-toolkit/'）：资源位于 /daily-toolkit/assets/*。
  // workbox 的 navigateFallback 与 manifest 的 start_url 都跟随 base，避免两者脱节。
  // 注：路由用的是 HashRouter（见 src/App.tsx），不依赖 base，故 base 切换不影响路由。
  return {
    base,
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
        start_url: base,
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // 预缓存只覆盖首屏必需资源；opencc / pdfjs / docx / modern-gif / jszip
        // 均为按需动态加载的大 chunk（合计约 2MB），不预缓存，
        // 由下方 runtimeCaching 在首次使用时 CacheFirst 落盘。
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: [
          'assets/opencc-*',
          'assets/pdf*',
          'assets/docx-*',
          'assets/modern-gif-*',
          'assets/jszip*',
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/__.*$/],
        runtimeCaching: [
          {
            // 按需加载的大型库 chunk：首次请求成功后即本地缓存，后续离线可用
            urlPattern: /\/assets\/(opencc|pdf|docx|modern-gif|jszip)[^/]*\.(js|mjs)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'heavy-libs-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
              },
            },
          },
        ],
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
          'modern-gif': ['modern-gif'],
          'docx': ['docx'],
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
