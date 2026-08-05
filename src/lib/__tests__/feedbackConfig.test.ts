/**
 * feedbackConfig.ts 单元测试
 *
 * 覆盖两条核心路径：
 *   1. **未配置**：环境变量缺失 / 空串 / 纯空白 → `getFeedbackFormUrl() === ''`
 *      且 `isFeedbackConfigured() === false`（页面据此渲染「意见箱即将开放」占位）。
 *   2. **已配置**：即使 URL 首尾带空格（用户从表单后台复制时很常见），
 *      也要返回去空白后的 URL，且 `isFeedbackConfigured() === true`。
 *
 * 模块内是懒读取（每次调用现读 `import.meta.env`），所以 `vi.stubEnv` 可在
 * 导入之后生效，无需重新 `import`。
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { getFeedbackFormUrl, isFeedbackConfigured } from '@/lib/feedbackConfig';

const FORM_URL = 'https://jinshuju.net/f/AbCdEf';

afterEach(() => {
  // 清掉本用例打的所有 env 桩，避免污染后续用例
  vi.unstubAllEnvs();
});

describe('feedbackConfig - 未配置', () => {
  it('环境变量完全未设置时，返回空串且判定为未配置', () => {
    // 显式把变量打成 undefined（vi.stubEnv 传 undefined 等价于删除该键）。
    // 不能「不打桩」就直接断言：本地 .env 里若真配了 URL，import.meta.env 就会带上它，
    // 用例会随环境时绿时红。这里把「未设置」这一前置条件固化下来。
    vi.stubEnv('VITE_FEEDBACK_FORM_URL', undefined as unknown as string);
    expect(getFeedbackFormUrl()).toBe('');
    expect(isFeedbackConfigured()).toBe(false);
  });

  it('环境变量为空串时，返回空串且判定为未配置', () => {
    vi.stubEnv('VITE_FEEDBACK_FORM_URL', '');
    expect(getFeedbackFormUrl()).toBe('');
    expect(isFeedbackConfigured()).toBe(false);
  });

  it('环境变量只有空白字符时，trim 后视为未配置', () => {
    vi.stubEnv('VITE_FEEDBACK_FORM_URL', '   \t\n ');
    expect(getFeedbackFormUrl()).toBe('');
    expect(isFeedbackConfigured()).toBe(false);
  });
});

describe('feedbackConfig - 已配置', () => {
  it('正常 URL 原样返回，并判定为已配置', () => {
    vi.stubEnv('VITE_FEEDBACK_FORM_URL', FORM_URL);
    expect(getFeedbackFormUrl()).toBe(FORM_URL);
    expect(isFeedbackConfigured()).toBe(true);
  });

  it('URL 首尾带空格时，返回 trim 后的地址并判定为已配置', () => {
    vi.stubEnv('VITE_FEEDBACK_FORM_URL', `   ${FORM_URL}   `);
    expect(getFeedbackFormUrl()).toBe(FORM_URL);
    expect(isFeedbackConfigured()).toBe(true);
  });

  it('URL 前后夹杂换行 / 制表符时同样能被清理干净', () => {
    vi.stubEnv('VITE_FEEDBACK_FORM_URL', `\n\t${FORM_URL}\t\n`);
    expect(getFeedbackFormUrl()).toBe(FORM_URL);
    expect(isFeedbackConfigured()).toBe(true);
  });
});
