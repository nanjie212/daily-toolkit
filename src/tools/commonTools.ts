/**
 * 首屏「常用工具」精选列表。
 *
 * 这是一份**静态精选**，不接任何个性化逻辑（收藏 / 最近使用是另外的既有功能）。
 * 想调整首屏展示的常用工具，只改这里的数组顺序或内容即可。
 *
 * 约定：
 * - 每个 id 必须真实存在于 `src/tools/*.ts` 注册的 ToolRecord 中，否则会被静默跳过。
 * - 顺序即展示顺序；移动端只展示前 6 个（见 HomeHero.tsx），所以把最日常的排在前面。
 */
export const COMMON_TOOL_IDS: string[] = [
  'simple-calculator', // 简易计算器
  'qrcode-generator', // 二维码生成
  'image-processor', // 图片处理（压缩/转换/缩放）
  'unit-converter', // 单位转换
  'date-calculator', // 日期计算器
  'password-generator', // 密码生成器
  'pdf-toolbox', // PDF 工具箱
  'text-processor', // 文本处理
  'mortgage-calculator', // 房贷计算器
  'id-photo', // 证件照制作
  'bmi-calculator', // BMI 计算器
  'countdown', // 倒计时
];

/** 移动端首屏展示的常用工具数量上限，避免英雄区在小屏被撑高。 */
export const COMMON_TOOLS_MOBILE_LIMIT = 6;
