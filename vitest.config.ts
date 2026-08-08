import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// 单独配置，避免引入 VitePWA 等仅在构建期生效的插件。
// `@/` 别名通过 vite-tsconfig-paths 解析，与运行时保持一致。
export default defineConfig({
  plugins: [tsconfigPaths()],
  // 必须与 vite.config.ts 的 define 保持一致。
  // FooterBar 里用到了 __APP_VERSION__ / __BUILD_DATE__ 这两个编译期常量，
  // 少了它们，任何渲染到页脚的测试都会抛 ReferenceError 并被 ErrorBoundary 吞成
  // 「出了点问题」——症状看着像组件坏了，实际只是测试环境缺注入。
  define: {
    __APP_VERSION__: JSON.stringify('1.2.1'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
  },
  test: {
    // 本机 vitest 4.1.10 默认 forks pool 间歇性报 `Cannot find package '@/...'` 等，
    // 换用 threads pool 稳定全绿（QA 验证过 --pool=threads 全量通过）。
    pool: 'threads',
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
