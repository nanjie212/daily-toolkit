/**
 * 云端共享留言板 — Cloudflare Workers 入口
 *
 * 设计要点（严格遵守「密钥不暴露给前端」红线）：
 *   - 本文件运行在 Cloudflare 边缘，D1 数据库通过 env.DB 绑定注入，token 仅服务端可见。
 *   - 前端零密钥，只通过 HTTPS 调用本 Worker 的公共接口。
 *   - 管理员密钥（隐藏/删除留言）来自环境变量 env.COMMUNITY_ADMIN_KEY，
 *     通过 `wrangler secret put COMMUNITY_ADMIN_KEY` 设置，绝不写进代码或前端 bundle。
 *
 * 防滥用（轻量、免费）：
 *   1) 按 deviceId|IP 限流（新留言/回复 60s 内各最多 1 条）。
 *   2) 内容长度校验（留言 ≤500 字，回复 ≤300 字）。
 *   3) 内置敏感词列表过滤，命中直接拒绝。
 *   4) 删除/隐藏为管理行为，需 x-admin-key 头校验。
 *
 * 本文件独立于前端 Vite bundle（位于 worker/ 目录，不在 src/ 内）。
 * 类型检查：npx tsc --noEmit -p worker/tsconfig.json
 */

// ---------------------------------------------------------------------------
// 最小化 D1 / Workers 类型声明（避免依赖 @cloudflare/workers-types，离线可 tsc）
// ---------------------------------------------------------------------------
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<{ results: Record<string, unknown>[] }>;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<{ success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  /** D1 数据库绑定（由 wrangler.toml 注入，token 不进前端） */
  DB: D1Database;
  /** 管理员密钥，运行时通过 wrangler secret 注入 */
  COMMUNITY_ADMIN_KEY: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// ---------------------------------------------------------------------------
// 常量配置
// ---------------------------------------------------------------------------

/** 新留言内容最大长度（字） */
const MAX_CONTENT_LENGTH = 500;
/** 回复内容最大长度（字） */
const MAX_REPLY_LENGTH = 300;
/** 昵称最大长度（字） */
const MAX_NICKNAME_LENGTH = 24;
/** 限流窗口（毫秒） */
const RATE_WINDOW_MS = 60_000;
/** 新留言限流阈值（每个 deviceId|IP 在窗口内最多 1 条） */
const MSG_RATE_LIMIT = 1;
/** 回复限流阈值（每个 deviceId|IP 在窗口内最多 3 条） */
const REPLY_RATE_LIMIT = 3;

/**
 * 内置敏感词列表（示例，可自由扩充）。
 * 命中即拒绝发布（返回 400 + 提示），不进入数据库。
 */
const BLOCKED_WORDS: string[] = [
  '广告', '代开发票', '办证', '赌博', '色情', '裸聊', '兼职刷单',
  '刷单', '加微信', 'vx', 'v信', '苔癣', '贷款', '套现', 'Fuck',
  'shit', '傻逼', 'sb', '草你', '操你', '诈骗',
];

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 获取客户端 IP（优先 cf-connecting-ip，其次 x-forwarded-for） */
function getClientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

/** 简单敏感词匹配（忽略大小写，命中返回命中的词） */
function matchBlocked(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (word && lower.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}

/** CORS 响应头（开发期允许 `*` 兜底；生产可改为仅限 CloudStudio 域名） */
function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-admin-key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** 统一 JSON 响应 */
function json(data: unknown, status: number, request: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}

/** 统一错误响应 */
function errorResponse(message: string, status: number, request: Request): Response {
  return json({ error: message, message }, status, request);
}

/** 处理 CORS 预检 */
function handleOptions(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

/** 限流检查：返回是否放行。基于 rate_limits 表（deviceId|IP + 时间窗口） */
async function checkRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean }> {
  const now = Date.now();
  const row = await db
    .prepare('SELECT count, window_start FROM rate_limits WHERE key = ?')
    .bind(key)
    .first();

  if (!row) {
    await db
      .prepare('INSERT INTO rate_limits (key, count, window_start) VALUES (?, ?, ?)')
      .bind(key, 1, now)
      .run();
    return { ok: true };
  }

  const windowStart = Number(row.window_start) || 0;
  const count = Number(row.count) || 0;

  // 窗口已过期 → 重置计数
  if (now - windowStart > windowMs) {
    await db
      .prepare('UPDATE rate_limits SET count = ?, window_start = ? WHERE key = ?')
      .bind(1, now, key)
      .run();
    return { ok: true };
  }

  if (count >= limit) {
    return { ok: false };
  }

  await db
    .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
    .bind(key)
    .run();
  return { ok: true };
}

/** 解析请求体 JSON（容错） */
async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// 业务处理函数
// ---------------------------------------------------------------------------

/** GET /api/messages —— 返回可见留言列表（含 replies），按时间倒序 */
async function handleList(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('deviceId') || '';

  const { results } = await env.DB
    .prepare("SELECT * FROM messages WHERE status = 'visible' ORDER BY created_at DESC")
    .all();

  const items = await Promise.all(
    results.map(async (row) => {
      const { results: reps } = await env.DB
        .prepare('SELECT * FROM replies WHERE message_id = ? ORDER BY created_at ASC')
        .bind(row.id)
        .all();

      const likedBy: string[] = safeParseArray(row.liked_by);
      const encouragedBy: string[] = safeParseArray(row.encouraged_by);

      return {
        id: row.id,
        nickname: row.nickname,
        content: row.content,
        timestamp: Number(row.created_at),
        likes: Number(row.likes) || 0,
        likedByMe: deviceId ? likedBy.includes(deviceId) : false,
        encourages: Number(row.encourages) || 0,
        encouragedByMe: deviceId ? encouragedBy.includes(deviceId) : false,
        replies: reps.map((r) => ({
          id: r.id,
          nickname: r.nickname,
          content: r.content,
          timestamp: Number(r.created_at),
        })),
      };
    }),
  );

  return json({ items }, 200, request);
}

/** POST /api/messages —— 发布新留言（校验长度/敏感词/限流） */
async function handleCreate(env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const nickname = String(body.nickname || '')
    .trim()
    .slice(0, MAX_NICKNAME_LENGTH) || '匿名用户';
  const content = String(body.content || '');
  const deviceId = String(body.deviceId || '');
  const ip = getClientIp(request);

  if (!content.trim()) {
    return errorResponse('内容不能为空', 400, request);
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return errorResponse(`内容不能超过 ${MAX_CONTENT_LENGTH} 字`, 400, request);
  }
  const hit = matchBlocked(content) || matchBlocked(nickname);
  if (hit) {
    return errorResponse('内容包含不当词汇，请修改后重试', 400, request);
  }

  const rl = await checkRateLimit(env.DB, `msg:${deviceId}|${ip}`, MSG_RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return errorResponse('发送太频繁，请稍后再试', 429, request);
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB
    .prepare(
      "INSERT INTO messages (id, nickname, content, likes, encourages, liked_by, encouraged_by, status, created_at) VALUES (?, ?, ?, 0, 0, '[]', '[]', 'visible', ?)",
    )
    .bind(id, nickname, content, now)
    .run();

  return json(
    {
      id,
      nickname,
      content,
      timestamp: now,
      likes: 0,
      likedByMe: false,
      encourages: 0,
      encouragedByMe: false,
      replies: [],
    },
    201,
    request,
  );
}

/** POST /api/messages/:id/like —— 按 deviceId 去重自增 likes */
async function handleLike(env: Env, id: string, request: Request): Promise<Response> {
  const body = await readJson(request);
  const deviceId = String(body.deviceId || '');
  if (!deviceId) {
    return errorResponse('缺少设备标识', 400, request);
  }

  const row = await env.DB
    .prepare("SELECT * FROM messages WHERE id = ? AND status = 'visible'")
    .bind(id)
    .first();
  if (!row) {
    return errorResponse('留言不存在', 404, request);
  }

  const likedBy: string[] = safeParseArray(row.liked_by);
  const has = likedBy.includes(deviceId);
  let likes = Number(row.likes) || 0;
  if (has) {
    likes -= 1;
    likedBy.splice(likedBy.indexOf(deviceId), 1);
  } else {
    likes += 1;
    likedBy.push(deviceId);
  }

  await env.DB
    .prepare('UPDATE messages SET likes = ?, liked_by = ? WHERE id = ?')
    .bind(likes, JSON.stringify(likedBy), id)
    .run();

  return json({ likes, likedByMe: !has }, 200, request);
}

/** POST /api/messages/:id/encourage —— 按 deviceId 去重自增 encourages */
async function handleEncourage(env: Env, id: string, request: Request): Promise<Response> {
  const body = await readJson(request);
  const deviceId = String(body.deviceId || '');
  if (!deviceId) {
    return errorResponse('缺少设备标识', 400, request);
  }

  const row = await env.DB
    .prepare("SELECT * FROM messages WHERE id = ? AND status = 'visible'")
    .bind(id)
    .first();
  if (!row) {
    return errorResponse('留言不存在', 404, request);
  }

  const encouragedBy: string[] = safeParseArray(row.encouraged_by);
  const has = encouragedBy.includes(deviceId);
  let encourages = Number(row.encourages) || 0;
  if (has) {
    encourages -= 1;
    encouragedBy.splice(encouragedBy.indexOf(deviceId), 1);
  } else {
    encourages += 1;
    encouragedBy.push(deviceId);
  }

  await env.DB
    .prepare('UPDATE messages SET encourages = ?, encouraged_by = ? WHERE id = ?')
    .bind(encourages, JSON.stringify(encouragedBy), id)
    .run();

  return json({ encourages, encouragedByMe: !has }, 200, request);
}

/** POST /api/messages/:id/reply —— 追加回复（校验长度/敏感词/限流） */
async function handleReply(env: Env, id: string, request: Request): Promise<Response> {
  const body = await readJson(request);
  const nickname = String(body.nickname || '')
    .trim()
    .slice(0, MAX_NICKNAME_LENGTH) || '匿名用户';
  const content = String(body.content || '');
  const deviceId = String(body.deviceId || '');
  const ip = getClientIp(request);

  if (!content.trim()) {
    return errorResponse('回复内容不能为空', 400, request);
  }
  if (content.length > MAX_REPLY_LENGTH) {
    return errorResponse(`回复内容不能超过 ${MAX_REPLY_LENGTH} 字`, 400, request);
  }
  const hit = matchBlocked(content) || matchBlocked(nickname);
  if (hit) {
    return errorResponse('内容包含不当词汇，请修改后重试', 400, request);
  }

  const parent = await env.DB
    .prepare("SELECT id FROM messages WHERE id = ? AND status = 'visible'")
    .bind(id)
    .first();
  if (!parent) {
    return errorResponse('留言不存在', 404, request);
  }

  const rl = await checkRateLimit(env.DB, `reply:${deviceId}|${ip}`, REPLY_RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return errorResponse('回复太频繁，请稍后再试', 429, request);
  }

  const replyId = crypto.randomUUID();
  const now = Date.now();
  await env.DB
    .prepare(
      'INSERT INTO replies (id, message_id, nickname, content, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(replyId, id, nickname, content, now)
    .run();

  return json(
    { id: replyId, message_id: id, nickname, content, timestamp: now },
    201,
    request,
  );
}

/** DELETE /api/messages/:id 或 POST /api/messages/:id/moderate —— 管理隐藏（软删除） */
async function handleModerate(env: Env, id: string, request: Request): Promise<Response> {
  const key = request.headers.get('x-admin-key') || '';
  if (!key || key !== env.COMMUNITY_ADMIN_KEY) {
    return errorResponse('无权操作', 401, request);
  }

  await env.DB
    .prepare("UPDATE messages SET status = 'hidden' WHERE id = ?")
    .bind(id)
    .run();

  return json({ ok: true, id, status: 'hidden' }, 200, request);
}

/** 安全解析 JSON 数组字段 */
function safeParseArray(value: unknown): string[] {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 路由分发
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // 列表
      if (path === '/api/messages' && method === 'GET') {
        return await handleList(env, request);
      }
      // 发布
      if (path === '/api/messages' && method === 'POST') {
        return await handleCreate(env, request);
      }
      // 点赞
      const likeMatch = path.match(/^\/api\/messages\/([^/]+)\/like$/);
      if (likeMatch && method === 'POST') {
        return await handleLike(env, likeMatch[1], request);
      }
      // 鼓励
      const encMatch = path.match(/^\/api\/messages\/([^/]+)\/encourage$/);
      if (encMatch && method === 'POST') {
        return await handleEncourage(env, encMatch[1], request);
      }
      // 回复
      const replyMatch = path.match(/^\/api\/messages\/([^/]+)\/reply$/);
      if (replyMatch && method === 'POST') {
        return await handleReply(env, replyMatch[1], request);
      }
      // 管理隐藏（DELETE 或 POST .../moderate）
      const modMatch = path.match(/^\/api\/messages\/([^/]+)\/moderate$/);
      if (modMatch && method === 'POST') {
        return await handleModerate(env, modMatch[1], request);
      }
      const delMatch = path.match(/^\/api\/messages\/([^/]+)$/);
      if (delMatch && method === 'DELETE') {
        return await handleModerate(env, delMatch[1], request);
      }

      return errorResponse('Not Found', 404, request);
    } catch (err) {
      const message = err instanceof Error ? err.message : '服务器内部错误';
      return errorResponse(message, 500, request);
    }
  },
};
