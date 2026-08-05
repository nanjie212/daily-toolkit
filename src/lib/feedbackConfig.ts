/**
 * 意见箱配置读取 —— 纯前端、零后端、零凭据。
 *
 * ## 背景
 * 留言板经历了三次演进：
 *   1. 自建 Serverless 后端 —— 服务商默认域名在大陆被墙，弃用。
 *   2. 国内 BaaS 云数据库 —— 需实名认证、手工建表、配 6 项权限，站长（非技术）无法维护，弃用。
 *   3. **当前：第三方表单意见箱**（金数据 / 腾讯问卷等）。
 *
 * ## 当前方案的设计取舍
 *   - **零后端**：意见提交完全发生在第三方表单的 iframe 内部，本项目代码
 *     不发起任何网络请求（无 fetch / 无 POST），前端 bundle 里也不存在任何凭据。
 *   - **零实时墙**：不再有共享留言列表、点赞、回复。取而代之的是
 *     `src/data/communityResponses.ts` —— 由站长从表单后台导出真实意见后，
 *     手动挑选、脱敏、附上回应，再粘贴进去的**静态**「站长回应区」。
 *   - **供应商无关**：这里只存一个 URL，换金数据 / 腾讯问卷 / 石墨表单都只改 `.env`，
 *     代码一行不用动。
 *
 * ## 配置方式
 * 在项目根目录 `.env` 中填写：
 * ```
 * VITE_FEEDBACK_FORM_URL=https://jinshuju.net/f/xxxxxx
 * ```
 * 留空或不填时，页面会展示「意见箱即将开放」的友好占位，不报错、不白屏。
 * 改完 `.env` 需重新构建（`npm run build`）才会生效。
 */

/**
 * 读取第三方意见表单的嵌入 / 分享地址。
 *
 * 注意：这里必须写成 `import.meta.env.VITE_XXX` 的字面量形式，
 * 否则 Vite 构建期的静态替换不会生效。
 *
 * @returns 去除首尾空白后的 URL；未配置 / 只填了空白字符时返回空字符串 `''`。
 */
export function getFeedbackFormUrl(): string {
  const raw = (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined) ?? '';
  return String(raw).trim();
}

/**
 * 意见箱是否已配置（供 UI 决定渲染 iframe 还是占位卡片）。
 *
 * @returns URL 非空即为已配置。
 */
export function isFeedbackConfigured(): boolean {
  return getFeedbackFormUrl().length > 0;
}
