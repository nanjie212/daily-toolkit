import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// 单独配置，避免引入 VitePWA 等仅在构建期生效的插件。
// `@/` 别名通过 vite-tsconfig-paths 解析，与运行时保持一致。
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
