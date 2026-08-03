/**
 * communityApi.ts 单元测试
 *
 * 覆盖：list / create / like / encourage / reply / moderate 各端点的
 * 正常路径、字段映射、请求构造，以及「故障降级」场景
 * （网络错误、HTTP 非 2xx、API 未配置）。
 *
 * 通过 mock 全局 fetch + 内存版 localStorage 完成，不依赖真实后端。
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// ---- 内存版 localStorage（供 deviceId 持久化与离线缓存测试） ----
function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}

const localStorageMock = createLocalStorageMock();

// 模块在测试前导入（此时已 stub 好 localStorage 与 env）
let api: typeof import('@/lib/communityApi');

beforeAll(async () => {
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubEnv('VITE_COMMUNITY_API', 'https://api.test.example');
  api = await import('@/lib/communityApi');
});

beforeEach(() => {
  // 每个用例使用全新的 fetch mock
  vi.stubGlobal('fetch', vi.fn());
  localStorageMock.clear();
  // 重置为已配置状态（部分用例会临时置空）
  vi.stubEnv('VITE_COMMUNITY_API', 'https://api.test.example');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---- 辅助：构造 Response 替身 ----
function makeRes(body: unknown, status = 200, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

function fetchMock() {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

const API_BASE = 'https://api.test.example';

// =========================================================================
// getDeviceId
// =========================================================================
describe('getDeviceId', () => {
  it('首次调用生成 UUID 并持久化', () => {
    const id = api.getDeviceId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    // safeStorage 以 JSON 形式存储，故本地值为带引号的字符串
    expect(localStorageMock.getItem('toolbox_device_id')).toBe(JSON.stringify(id));
  });

  it('重复调用返回同一 ID（稳定）', () => {
    const a = api.getDeviceId();
    const b = api.getDeviceId();
    expect(a).toBe(b);
  });

  it('不同实例间共享同一持久化 ID', async () => {
    const first = api.getDeviceId();
    const mod2 = await import('@/lib/communityApi');
    expect(mod2.getDeviceId()).toBe(first);
  });

  it('ID 使用 crypto.randomUUID 格式', () => {
    const id = api.getDeviceId();
    expect(id.length).toBe(36);
  });
});

// =========================================================================
// listMessages
// =========================================================================
describe('listMessages', () => {
  it('正常返回并映射留言列表', async () => {
    const items = [
      {
        id: 'm1',
        nickname: '张三',
        content: '你好',
        timestamp: 1000,
        likes: 2,
        likedByMe: false,
        encourages: 1,
        encouragedByMe: false,
        replies: [],
      },
    ];
    fetchMock().mockResolvedValue(makeRes({ items }));
    const result = await api.listMessages();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('m1');
    expect(result[0].nickname).toBe('张三');
  });

  it('使用 GET 方法且 URL 正确（含 deviceId 查询参数）', async () => {
    fetchMock().mockResolvedValue(makeRes({ items: [] }));
    await api.listMessages();
    const [url, opts] = fetchMock().mock.calls[0];
    expect(url.startsWith(`${API_BASE}/api/messages`)).toBe(true);
    expect(url).toContain('deviceId=');
    expect(opts.method).toBe('GET');
  });

  it('在 URL 中带上 deviceId 查询参数', async () => {
    fetchMock().mockResolvedValue(makeRes({ items: [] }));
    await api.listMessages();
    const [url] = fetchMock().mock.calls[0];
    const deviceId = api.getDeviceId();
    expect(url).toContain(`deviceId=${deviceId}`);
  });

  it('likedByMe=true 时映射 liked_by 含本机 deviceId', async () => {
    const deviceId = api.getDeviceId();
    fetchMock().mockResolvedValue(
      makeRes({
        items: [
          { id: 'm1', nickname: 'a', content: 'x', timestamp: 1, likes: 1, likedByMe: true, encourages: 0, encouragedByMe: false, replies: [] },
        ],
      }),
    );
    const result = await api.listMessages();
    expect(result[0].liked_by).toEqual([deviceId]);
  });

  it('likedByMe=false 时 liked_by 为空数组', async () => {
    fetchMock().mockResolvedValue(
      makeRes({
        items: [
          { id: 'm1', nickname: 'a', content: 'x', timestamp: 1, likes: 1, likedByMe: false, encourages: 0, encouragedByMe: false, replies: [] },
        ],
      }),
    );
    const result = await api.listMessages();
    expect(result[0].liked_by).toEqual([]);
  });

  it('encouragedByMe=true 时映射 encouraged_by 含 deviceId', async () => {
    const deviceId = api.getDeviceId();
    fetchMock().mockResolvedValue(
      makeRes({
        items: [
          { id: 'm1', nickname: 'a', content: 'x', timestamp: 1, likes: 0, likedByMe: false, encourages: 3, encouragedByMe: true, replies: [] },
        ],
      }),
    );
    const result = await api.listMessages();
    expect(result[0].encouraged_by).toEqual([deviceId]);
  });

  it('嵌套 replies 被正确映射', async () => {
    fetchMock().mockResolvedValue(
      makeRes({
        items: [
          {
            id: 'm1', nickname: 'a', content: 'x', timestamp: 1, likes: 0, likedByMe: false, encourages: 0, encouragedByMe: false,
            replies: [{ id: 'r1', nickname: 'b', content: 'reply', timestamp: 2 }],
          },
        ],
      }),
    );
    const result = await api.listMessages();
    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies[0].id).toBe('r1');
    expect(result[0].replies[0].content).toBe('reply');
  });

  it('缺少 items 字段时返回空数组', async () => {
    fetchMock().mockResolvedValue(makeRes({}));
    const result = await api.listMessages();
    expect(result).toEqual([]);
  });

  it('空列表返回空数组', async () => {
    fetchMock().mockResolvedValue(makeRes({ items: [] }));
    const result = await api.listMessages();
    expect(result).toEqual([]);
  });

  it('服务器返回 500 时抛出 ApiError', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: 'boom' }, 500, 'Internal Server Error'));
    await expect(api.listMessages()).rejects.toBeInstanceOf(api.ApiError);
  });

  it('ApiError 携带状态码与消息', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: 'server down' }, 503, 'Service Unavailable'));
    try {
      await api.listMessages();
      throw new Error('should not reach');
    } catch (e) {
      expect(e).toBeInstanceOf(api.ApiError);
      expect((e as api.ApiError).status).toBe(503);
      expect((e as api.ApiError).message).toBe('server down');
    }
  });

  it('fetch 网络失败时抛出（触发本地降级）', async () => {
    fetchMock().mockRejectedValue(new Error('Failed to fetch'));
    await expect(api.listMessages()).rejects.toBeInstanceOf(api.ApiError);
  });

  it('API 未配置时抛出 ApiNotConfiguredError', async () => {
    vi.stubEnv('VITE_COMMUNITY_API', '');
    await expect(api.listMessages()).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
  });
});

// =========================================================================
// createMessage
// =========================================================================
describe('createMessage', () => {
  it('POST 正确发送 nickname 与 content', async () => {
    fetchMock().mockResolvedValue(
      makeRes({ id: 'm1', nickname: '张三', content: 'hi', timestamp: 1, likes: 0, likedByMe: false, encourages: 0, encouragedByMe: false, replies: [] }, 201),
    );
    await api.createMessage({ nickname: '张三', content: 'hi' });
    const [url, opts] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages`);
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.nickname).toBe('张三');
    expect(body.content).toBe('hi');
  });

  it('请求体自动附带 deviceId', async () => {
    fetchMock().mockResolvedValue(makeRes({ id: 'm1', nickname: 'a', content: 'x', timestamp: 1, likes: 0, likedByMe: false, encourages: 0, encouragedByMe: false, replies: [] }, 201));
    await api.createMessage({ nickname: 'a', content: 'x' });
    const body = JSON.parse(fetchMock().mock.calls[0][1].body);
    expect(body.deviceId).toBe(api.getDeviceId());
  });

  it('设置 content-type 为 application/json', async () => {
    fetchMock().mockResolvedValue(makeRes({ id: 'm1', nickname: 'a', content: 'x', timestamp: 1, likes: 0, likedByMe: false, encourages: 0, encouragedByMe: false, replies: [] }, 201));
    await api.createMessage({ nickname: 'a', content: 'x' });
    expect(fetchMock().mock.calls[0][1].headers['content-type']).toBe('application/json');
  });

  it('返回映射后的 CommunityMessage', async () => {
    fetchMock().mockResolvedValue(
      makeRes({ id: 'm9', nickname: '李四', content: 'world', timestamp: 42, likes: 0, likedByMe: false, encourages: 0, encouragedByMe: false, replies: [] }, 201),
    );
    const result = await api.createMessage({ nickname: '李四', content: 'world' });
    expect(result.id).toBe('m9');
    expect(result.content).toBe('world');
    expect(result.liked_by).toEqual([]);
    expect(result.replies).toEqual([]);
  });

  it('服务端 400（内容超长/敏感词）抛出 ApiError(400)', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: '内容包含不当词汇，请修改后重试' }, 400, 'Bad Request'));
    await expect(api.createMessage({ nickname: 'a', content: '广告' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('服务端 429（限流）抛出 ApiError(429)', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: '发送太频繁，请稍后再试' }, 429, 'Too Many Requests'));
    await expect(api.createMessage({ nickname: 'a', content: 'hi' })).rejects.toMatchObject({
      status: 429,
    });
  });

  it('网络失败时抛出（调用方降级为离线草稿）', async () => {
    fetchMock().mockRejectedValue(new Error('offline'));
    await expect(api.createMessage({ nickname: 'a', content: 'hi' })).rejects.toBeInstanceOf(api.ApiError);
  });

  it('API 未配置时抛出 ApiNotConfiguredError', async () => {
    vi.stubEnv('VITE_COMMUNITY_API', '');
    await expect(api.createMessage({ nickname: 'a', content: 'hi' })).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
  });

  it('返回的 timestamp 为数字类型', async () => {
    fetchMock().mockResolvedValue(
      makeRes({ id: 'm1', nickname: 'a', content: 'x', timestamp: 123456, likes: 0, likedByMe: false, encourages: 0, encouragedByMe: false, replies: [] }, 201),
    );
    const result = await api.createMessage({ nickname: 'a', content: 'x' });
    expect(typeof result.timestamp).toBe('number');
  });
});

// =========================================================================
// likeMessage
// =========================================================================
describe('likeMessage', () => {
  it('POST 到正确 URL 并带 deviceId', async () => {
    const deviceId = api.getDeviceId();
    fetchMock().mockResolvedValue(makeRes({ likes: 5, likedByMe: true }));
    await api.likeMessage('m1', deviceId);
    const [url, opts] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages/m1/like`);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ deviceId });
  });

  it('URL 对 id 进行 encodeURIComponent 编码', async () => {
    const deviceId = api.getDeviceId();
    fetchMock().mockResolvedValue(makeRes({ likes: 1, likedByMe: true }));
    await api.likeMessage('a/b?c', deviceId);
    const [url] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages/a%2Fb%3Fc/like`);
  });

  it('返回 { likes, likedByMe }', async () => {
    fetchMock().mockResolvedValue(makeRes({ likes: 7, likedByMe: false }));
    const result = await api.likeMessage('m1', api.getDeviceId());
    expect(result).toEqual({ likes: 7, likedByMe: false });
  });

  it('服务端 404 抛出 ApiError(404)', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: '留言不存在' }, 404, 'Not Found'));
    await expect(api.likeMessage('nope', api.getDeviceId())).rejects.toMatchObject({ status: 404 });
  });

  it('服务端 429 抛出 ApiError(429)', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: '太频繁' }, 429, 'Too Many Requests'));
    await expect(api.likeMessage('m1', api.getDeviceId())).rejects.toMatchObject({ status: 429 });
  });

  it('网络失败抛出（本地降级 toggle）', async () => {
    fetchMock().mockRejectedValue(new Error('net'));
    await expect(api.likeMessage('m1', api.getDeviceId())).rejects.toBeInstanceOf(api.ApiError);
  });

  it('请求头包含 content-type', async () => {
    fetchMock().mockResolvedValue(makeRes({ likes: 1, likedByMe: true }));
    await api.likeMessage('m1', api.getDeviceId());
    expect(fetchMock().mock.calls[0][1].headers['content-type']).toBe('application/json');
  });

  it('API 未配置时抛出 ApiNotConfiguredError', async () => {
    vi.stubEnv('VITE_COMMUNITY_API', '');
    await expect(api.likeMessage('m1', 'dev')).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
  });
});

// =========================================================================
// encourageMessage
// =========================================================================
describe('encourageMessage', () => {
  it('POST 正确 URL 并带 deviceId', async () => {
    const deviceId = api.getDeviceId();
    fetchMock().mockResolvedValue(makeRes({ encourages: 3, encouragedByMe: true }));
    await api.encourageMessage('m1', deviceId);
    const [url, opts] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages/m1/encourage`);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ deviceId });
  });

  it('返回 { encourages, encouragedByMe }', async () => {
    fetchMock().mockResolvedValue(makeRes({ encourages: 9, encouragedByMe: false }));
    const result = await api.encourageMessage('m1', api.getDeviceId());
    expect(result).toEqual({ encourages: 9, encouragedByMe: false });
  });

  it('编码特殊 id', async () => {
    fetchMock().mockResolvedValue(makeRes({ encourages: 1, encouragedByMe: true }));
    await api.encourageMessage('x y', api.getDeviceId());
    const [url] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages/x%20y/encourage`);
  });

  it('服务端 404 抛出 ApiError', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: 'not found' }, 404, 'Not Found'));
    await expect(api.encourageMessage('nope', api.getDeviceId())).rejects.toMatchObject({ status: 404 });
  });

  it('网络失败抛出', async () => {
    fetchMock().mockRejectedValue(new Error('net'));
    await expect(api.encourageMessage('m1', api.getDeviceId())).rejects.toBeInstanceOf(api.ApiError);
  });

  it('请求头 content-type 正确', async () => {
    fetchMock().mockResolvedValue(makeRes({ encourages: 1, encouragedByMe: true }));
    await api.encourageMessage('m1', api.getDeviceId());
    expect(fetchMock().mock.calls[0][1].headers['content-type']).toBe('application/json');
  });

  it('API 未配置抛出 ApiNotConfiguredError', async () => {
    vi.stubEnv('VITE_COMMUNITY_API', '');
    await expect(api.encourageMessage('m1', 'dev')).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
  });
});

// =========================================================================
// replyMessage
// =========================================================================
describe('replyMessage', () => {
  it('POST 正确 URL 并发送 nickname/content', async () => {
    fetchMock().mockResolvedValue(makeRes({ id: 'r1', nickname: '小王', content: '好的', timestamp: 1 }));
    await api.replyMessage('m1', { nickname: '小王', content: '好的' });
    const [url, opts] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages/m1/reply`);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toMatchObject({ nickname: '小王', content: '好的' });
  });

  it('请求体自动附带 deviceId', async () => {
    fetchMock().mockResolvedValue(makeRes({ id: 'r1', nickname: 'a', content: 'x', timestamp: 1 }));
    await api.replyMessage('m1', { nickname: 'a', content: 'x' });
    const body = JSON.parse(fetchMock().mock.calls[0][1].body);
    expect(body.deviceId).toBe(api.getDeviceId());
  });

  it('返回映射后的 CommunityReply', async () => {
    fetchMock().mockResolvedValue(makeRes({ id: 'r2', nickname: '小李', content: '收到', timestamp: 99 }));
    const result = await api.replyMessage('m1', { nickname: '小李', content: '收到' });
    expect(result).toEqual({ id: 'r2', nickname: '小李', content: '收到', timestamp: 99 });
  });

  it('服务端 400 抛出 ApiError', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: '回复内容不能为空' }, 400, 'Bad Request'));
    await expect(api.replyMessage('m1', { nickname: 'a', content: '' })).rejects.toMatchObject({ status: 400 });
  });

  it('网络失败抛出', async () => {
    fetchMock().mockRejectedValue(new Error('net'));
    await expect(api.replyMessage('m1', { nickname: 'a', content: 'x' })).rejects.toBeInstanceOf(api.ApiError);
  });

  it('API 未配置抛出 ApiNotConfiguredError', async () => {
    vi.stubEnv('VITE_COMMUNITY_API', '');
    await expect(api.replyMessage('m1', { nickname: 'a', content: 'x' })).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
  });
});

// =========================================================================
// moderateMessage（管理隐藏）
// =========================================================================
describe('moderateMessage', () => {
  it('DELETE 正确 URL 并带 x-admin-key 头', async () => {
    fetchMock().mockResolvedValue(makeRes({ ok: true }, 200));
    await api.moderateMessage('m1', 'secret-key');
    const [url, opts] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages/m1`);
    expect(opts.method).toBe('DELETE');
    expect(opts.headers['x-admin-key']).toBe('secret-key');
  });

  it('编码特殊 id', async () => {
    fetchMock().mockResolvedValue(makeRes({ ok: true }, 200));
    await api.moderateMessage('a/b', 'k');
    const [url] = fetchMock().mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/messages/a%2Fb`);
  });

  it('成功返回 true', async () => {
    fetchMock().mockResolvedValue(makeRes({ ok: true }, 200));
    const result = await api.moderateMessage('m1', 'k');
    expect(result).toBe(true);
  });

  it('错误密钥返回 401 抛出 ApiError', async () => {
    fetchMock().mockResolvedValue(makeRes({ message: '无权操作' }, 401, 'Unauthorized'));
    await expect(api.moderateMessage('m1', 'wrong')).rejects.toMatchObject({ status: 401 });
  });

  it('网络失败抛出', async () => {
    fetchMock().mockRejectedValue(new Error('net'));
    await expect(api.moderateMessage('m1', 'k')).rejects.toBeInstanceOf(api.ApiError);
  });

  it('API 未配置抛出 ApiNotConfiguredError', async () => {
    vi.stubEnv('VITE_COMMUNITY_API', '');
    await expect(api.moderateMessage('m1', 'k')).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
  });
});

// =========================================================================
// 故障降级 / 错误类型
// =========================================================================
describe('故障降级与错误类型', () => {
  it('ApiError 是 Error 的子类且 name 正确', () => {
    const e = new api.ApiError(500, 'x');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ApiError');
    expect(e.status).toBe(500);
  });

  it('ApiNotConfiguredError 是 Error 的子类', () => {
    const e = new api.ApiNotConfiguredError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ApiNotConfiguredError');
  });

  it('所有读/写函数在未配置时均抛 ApiNotConfiguredError', async () => {
    vi.stubEnv('VITE_COMMUNITY_API', '');
    await expect(api.listMessages()).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
    await expect(api.createMessage({ nickname: 'a', content: 'x' })).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
    await expect(api.likeMessage('m', 'd')).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
    await expect(api.encourageMessage('m', 'd')).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
    await expect(api.replyMessage('m', { nickname: 'a', content: 'x' })).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
    await expect(api.moderateMessage('m', 'k')).rejects.toBeInstanceOf(api.ApiNotConfiguredError);
  });

  it('网络错误统一包装为 ApiError(status=0)', async () => {
    fetchMock().mockRejectedValue(new TypeError('Failed to fetch'));
    try {
      await api.listMessages();
      throw new Error('unreachable');
    } catch (e) {
      expect(e).toBeInstanceOf(api.ApiError);
      expect((e as api.ApiError).status).toBe(0);
    }
  });

  it('2xx 但响应体非 JSON 不崩溃（text 解析兜底）', async () => {
    fetchMock().mockResolvedValue({ ok: true, status: 200, statusText: 'OK', json: async () => { throw new Error('bad'); }, text: async () => '' });
    const result = await api.listMessages();
    expect(result).toEqual([]);
  });

  it('错误响应体缺少 message 时回退到 statusText', async () => {
    fetchMock().mockResolvedValue(makeRes({ foo: 'bar' }, 418, 'I am a teapot'));
    try {
      await api.listMessages();
      throw new Error('unreachable');
    } catch (e) {
      expect((e as api.ApiError).message).toBe('I am a teapot');
    }
  });

  it('导出类型 CommunityMessage 字段完整', async () => {
    fetchMock().mockResolvedValue(
      makeRes({
        items: [{ id: 'm1', nickname: 'a', content: 'x', timestamp: 1, likes: 0, likedByMe: false, encourages: 0, encouragedByMe: false, replies: [] }],
      }),
    );
    const [m] = await api.listMessages();
    expect(Object.keys(m).sort()).toEqual(
      ['content', 'encouraged_by', 'encourages', 'id', 'liked_by', 'likes', 'nickname', 'replies', 'timestamp'].sort(),
    );
  });
});
