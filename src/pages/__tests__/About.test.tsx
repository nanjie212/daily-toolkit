import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import About from '@/pages/About';
import { builtInTools } from '@/tools';

/**
 * C2「关于」页验收测试。
 *
 * 关注点（按 team-lead 的验收清单）：
 * 1. 四节（关于 / FAQ / 免责 / 隐私）都渲染出来
 * 2. 占位符 {TOOL_COUNT} / {LAST_UPDATED} 已在渲染期被真实值替换，页面里不能残留花括号原文
 * 3. 条目数量符合 PM 原稿：FAQ 8 条、免责 5 条、隐私 8 条
 * 4. 合规口径（不上传 / 无第三方统计 / 意见箱是唯一例外）没有在改写中丢失
 * 5. 不出现营销腔禁用词，也不出现 C3 已删除的「汇率」「OCR」等不存在的能力
 *
 * About 是纯展示组件、无 hooks / 无 router 依赖，所以用 renderToStaticMarkup
 * 直出字符串断言即可，无需 DOM 环境。
 */

/** 与首屏 / 引导弹窗同源的营销腔禁用词。 */
const BANNED_WORDS = ['赋能', '全能', '强大', '高效生产力', '一站式', '智能平台', '提升效率'];

/** C3 已确认全站不存在的能力，文案里不能再提。 */
const NONEXISTENT_FEATURES = ['汇率', 'OCR'];

const html = renderToStaticMarkup(React.createElement(About));

/** 去掉标签，拿纯文本做「条目计数」以外的语义断言，避免被 class 名误伤。 */
const text = html.replace(/<[^>]+>/g, '');

describe('About 页面 (C2)', () => {
  describe('四节结构', () => {
    it('渲染「关于这个站」为 h1', () => {
      expect(html).toMatch(/<h1[^>]*>关于这个站<\/h1>/);
    });

    it.each(['常见问题', '免责声明', '隐私说明'])('渲染「%s」为 h2', (heading) => {
      expect(html).toMatch(new RegExp(`<h2[^>]*>${heading}</h2>`));
    });

    it('四节标题按「关于 → FAQ → 免责 → 隐私」的顺序出现', () => {
      const order = ['关于这个站', '常见问题', '免责声明', '隐私说明'].map((h) =>
        text.indexOf(h),
      );
      expect(order.every((i) => i >= 0)).toBe(true);
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });
  });

  describe('占位符替换', () => {
    it('页面不残留任何未替换的占位符原文', () => {
      expect(html).not.toContain('{TOOL_COUNT}');
      expect(html).not.toContain('{LAST_UPDATED}');
      // 兜底：整页不应出现任何 {大写下划线} 形态的占位符
      expect(html).not.toMatch(/\{[A-Z_]{3,}\}/);
    });

    it('TOOL_COUNT 取自 builtInTools.length，且当前为 66', () => {
      expect(builtInTools.length).toBe(66);
      expect(html).toContain(`>${builtInTools.length}</strong> 个`);
    });

    it('LAST_UPDATED 渲染为 2026-08-06', () => {
      expect(text).toContain('最后更新：2026-08-06');
    });
  });

  describe('条目数量与 PM 原稿一致', () => {
    it('FAQ 恰好 8 条，且按 1. ~ 8. 编号', () => {
      const faqHeadings = html.match(/<h3[^>]*>\d+\.\s/g) ?? [];
      expect(faqHeadings).toHaveLength(8);
      for (let i = 1; i <= 8; i += 1) {
        expect(text).toContain(`${i}. `);
      }
    });

    it('免责声明 5 条要点全部出现', () => {
      const titles = [
        '房贷、贷款类计算器',
        '个税、年终奖个税计算器',
        'BMI、体脂率、基础代谢、心率区间等健康类工具',
        '预产期、经期推算',
        '通用说明',
      ];
      for (const title of titles) {
        expect(text, `免责声明应包含「${title}」`).toContain(title);
      }
    });

    it('隐私说明为 8 条列表项', () => {
      const privacyBlock = html.slice(html.indexOf('隐私说明'));
      const items = privacyBlock.match(/<li[^>]*>/g) ?? [];
      expect(items).toHaveLength(8);
    });
  });

  describe('合规口径不能在改写中丢失', () => {
    it.each([
      ['不收集个人信息', '不收集任何个人信息'],
      ['无第三方统计/广告/追踪', '没有任何第三方统计、广告或追踪脚本'],
      ['文件不离开设备', '文件不离开你的设备'],
      ['意见箱是唯一例外', '唯一的例外是社区意见箱'],
      ['使用时长仅本地七天', '只保留最近七天'],
    ])('保留「%s」口径', (_label, sentence) => {
      expect(text).toContain(sentence);
    });

    it('免责声明明确「不构成医疗建议」与「不承担责任」', () => {
      expect(text).toContain('不构成医疗建议');
      expect(text).toContain('不承担责任');
    });
  });

  describe('文案红线', () => {
    it('不出现营销腔禁用词', () => {
      for (const word of BANNED_WORDS) {
        expect(text, `About 文案不应出现「${word}」`).not.toContain(word);
      }
    });

    it('不宣传实际不存在的能力（C3 已从分类描述中移除的项）', () => {
      for (const feature of NONEXISTENT_FEATURES) {
        expect(text, `About 文案不应提及不存在的「${feature}」`).not.toContain(feature);
      }
    });
  });
});
