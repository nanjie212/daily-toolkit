/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

/**
 * 项目自定义环境变量声明（与 `vite/client` 的 ImportMetaEnv 做接口合并）。
 * 全部为可选：缺失时相关功能会自动降级为友好占位，见 src/lib/feedbackConfig.ts。
 */
interface ImportMetaEnv {
  /**
   * 第三方意见表单（金数据 / 腾讯问卷等）的嵌入 / 分享地址。
   * 留空则「社区意见箱」页面展示「意见箱即将开放」占位，不报错。
   */
  readonly VITE_FEEDBACK_FORM_URL?: string;
  /** 【已停用】Cloudflare Worker 留言板 API base，保留仅为回滚方便 */
  readonly VITE_COMMUNITY_API?: string;
}
