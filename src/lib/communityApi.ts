/**
 * 云端共享留言板 — 前端网络层
 *
 * 职责：封装所有对 Cloudflare Worker（D1 后端）的 HTTP 调用。
 * 设计原则（与 Community.tsx 解耦、密钥不暴露）：
 *   - API base 仅来自环境变量 `import.meta.env.VITE_COMMUNITY_API`，绝不硬编码。
 *   - 不持有任何写入权限密钥；管理员密钥由调用方（站长）在运行时通过参数传入，
 *     只出现在 moderateMessage 的请求头，不落入前端存储。
 *   - 每个函数都是 try/catch 友好的：网络/HTTP 失败会抛错，由调用方（Community.tsx）
 *     降级到本地 safeStorage 草稿/缓存。
 *
 * deviceId：每浏览器一个匿名设备 ID，存于 safeStorage（key=toolbox_device_id），
 * 用于点赞/鼓励去重与限流，替代纯昵称去重（避免不同人昵称相同导致误 toggle）。
 */

import { safeStorage } from '@/lib/safeStorage';

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 服务端返回的回复 DTO */
export interface ReplyDTO {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
}

/** 服务端返回的留言 DTO */
export interface MessageDTO {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  likedByMe: boolean;
  encourages: number;
  encouragedByMe: boolean;
  replies: ReplyDTO[];
}

/** 前端使用的留言结构（字段名与 Community.tsx 的 Message 兼容） */
export interface CommunityReply {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
}

export interface CommunityMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  liked_by: string[];
  encourages: number;
  encouraged_by: string[];
  replies: CommunityReply[];
}

export interface CreateMessageInput {
  nickname: string;
  content: string;
}

export interface ReplyInput {
  nickname: string;
  content: string;
}

export interface LikeResult {
  likes: number;
  likedByMe: boolean;
}

export interface EncourageResult {
  encourages: number;
  encouragedByMe: boolean;
}

// ---------------------------------------------------------------------------
// 错误类型
// ---------------------------------------------------------------------------

/** HTTP 业务错误（非 2xx 响应） */
export class ApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** API 未配置（VITE_COMMUNITY_API 为空）时抛出，用于触发本地降级 */
export class ApiNotConfiguredError extends Error {
  constructor() {
    super('云端留言板 API 未配置（VITE_COMMUNITY_API 为空），已降级到本地缓存');
    this.name = 'ApiNotConfiguredError';
  }
}

// ---------------------------------------------------------------------------
// 设备 ID
// ---------------------------------------------------------------------------

const DEVICE_ID_KEY = 'toolbox_device_id';

/**
 * 获取（或首次生成并持久化）本浏览器匿名设备 ID。
 * 用于点赞/鼓励去重与限流，存于 safeStorage，不随昵称变化。
 */
export function getDeviceId(): string {
  const existing = safeStorage.getJSON<string | null>(DEVICE_ID_KEY, null);
  if (existing) return existing;
  const id = crypto.randomUUID();
  safeStorage.setJSON(DEVICE_ID_KEY, id);
  return id;
}

// ---------------------------------------------------------------------------
// 内部请求工具
// ---------------------------------------------------------------------------

/** 读取 API base（懒加载，便于测试中切换环境变量） */
function getApiBase(): string {
  const base = (import.meta.env.VITE_COMMUNITY_API as string | undefined) ?? '';
  return base.replace(/\/+$/, '');
}

/** 统一请求封装：自动拼接 base、设置 JSON 头、解析错误 */
async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const base = getApiBase();
  if (!base) {
    throw new ApiNotConfiguredError();
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch (err) {
    // 网络层失败（离线 / DNS / CORS），抛给调用方做本地降级
    throw new ApiError(0, err instanceof Error ? err.message : '网络请求失败');
  }

  if (!response.ok) {
    let message = response.statusText || `请求失败 (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      if (body?.message) message = body.message;
      else if (body?.error) message = body.error;
    } catch {
      // 响应体非 JSON，使用状态文本
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

/** 把服务端 DTO 映射为前端 CommunityMessage（用 deviceId 反推 liked_by / encouraged_by） */
function mapMessage(dto: MessageDTO, deviceId: string): CommunityMessage {
  return {
    id: dto.id,
    nickname: dto.nickname,
    content: dto.content,
    timestamp: dto.timestamp,
    likes: dto.likes ?? 0,
    liked_by: dto.likedByMe ? [deviceId] : [],
    encourages: dto.encourages ?? 0,
    encouraged_by: dto.encouragedByMe ? [deviceId] : [],
    replies: (dto.replies ?? []).map((r) => ({
      id: r.id,
      nickname: r.nickname,
      content: r.content,
      timestamp: r.timestamp,
    })),
  };
}

// ---------------------------------------------------------------------------
// 公共 API
// ---------------------------------------------------------------------------

/** GET /api/messages —— 拉取留言列表（含 replies），已按时间倒序 */
export async function listMessages(): Promise<CommunityMessage[]> {
  const deviceId = getDeviceId();
  const data = await request<{ items: MessageDTO[] }>(
    `/api/messages?deviceId=${encodeURIComponent(deviceId)}`,
    { method: 'GET' },
  );
  const items = data?.items ?? [];
  return items.map((d) => mapMessage(d, deviceId));
}

/** POST /api/messages —— 发布新留言 */
export async function createMessage(input: CreateMessageInput): Promise<CommunityMessage> {
  const deviceId = getDeviceId();
  const data = await request<MessageDTO>('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ ...input, deviceId }),
  });
  return mapMessage(data, deviceId);
}

/** POST /api/messages/:id/like —— 点赞（按 deviceId 去重，服务端 toggle） */
export async function likeMessage(id: string, deviceId: string): Promise<LikeResult> {
  return request<LikeResult>(`/api/messages/${encodeURIComponent(id)}/like`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}

/** POST /api/messages/:id/encourage —— 鼓励（按 deviceId 去重，服务端 toggle） */
export async function encourageMessage(
  id: string,
  deviceId: string,
): Promise<EncourageResult> {
  return request<EncourageResult>(`/api/messages/${encodeURIComponent(id)}/encourage`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}

/** POST /api/messages/:id/reply —— 追加回复 */
export async function replyMessage(
  id: string,
  input: ReplyInput,
): Promise<CommunityReply> {
  const deviceId = getDeviceId();
  return request<CommunityReply>(`/api/messages/${encodeURIComponent(id)}/reply`, {
    method: 'POST',
    body: JSON.stringify({ ...input, deviceId }),
  });
}

/**
 * DELETE /api/messages/:id —— 管理隐藏（软删除，status 置 hidden）。
 * 需要管理员密钥，仅由站长在管理页输入，运行时传入，绝不持久化到前端存储。
 */
export async function moderateMessage(id: string, adminKey: string): Promise<boolean> {
  await request<{ ok: boolean }>(`/api/messages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': adminKey },
  });
  return true;
}
