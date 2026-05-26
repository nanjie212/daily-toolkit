// Cloudflare Pages Function - 留言板 API
// 部署后访问路径: /api/messages

interface Env {
  DB: D1Database;
}

interface Message {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  liked_by: string;
}

interface Reply {
  id: string;
  message_id: string;
  nickname: string;
  content: string;
  timestamp: number;
}

// 解析请求体
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  const formData = await request.formData();
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}

// 正确返回JSON
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

// 获取所有留言（含回复）
export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { env } = context;
    const msgs = await env.DB.prepare('SELECT * FROM messages ORDER BY timestamp DESC').all<Message>();
    const replies = await env.DB.prepare('SELECT * FROM replies ORDER BY timestamp ASC').all<Reply>();

    const replyMap: Record<string, Reply[]> = {};
    for (const r of replies.results) {
      if (!replyMap[r.message_id]) replyMap[r.message_id] = [];
      replyMap[r.message_id].push(r);
    }

    const enriched = msgs.results.map((msg) => ({
      ...msg,
      liked_by: JSON.parse(msg.liked_by || '[]'),
      replies: replyMap[msg.id] || [],
    }));

    return json(enriched);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

// 发布留言
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const body = await readBody(request);
    const { id, nickname, content, timestamp } = body as Record<string, string>;

    if (!id || !nickname || !content || !timestamp) {
      return json({ error: '缺少必填字段' }, 400);
    }
    if (content.length > 500) {
      return json({ error: '留言内容不能超过500字' }, 400);
    }

    await env.DB.prepare(
      'INSERT INTO messages (id, nickname, content, timestamp, likes, liked_by) VALUES (?1, ?2, ?3, ?4, 0, \'[]\')'
    ).bind(id, nickname, content, Number(timestamp)).run();

    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

// 删除留言
export async function onRequestDelete(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return json({ error: '缺少 id 参数' }, 400);

    await env.DB.prepare('DELETE FROM replies WHERE message_id = ?1').bind(id).run();
    await env.DB.prepare('DELETE FROM messages WHERE id = ?1').bind(id).run();

    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

// 点赞/取消点赞 (PUT 方法)
export async function onRequestPut(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const body = await readBody(request);
    const action = body.action as string; // 'like' | 'unlike' | 'reply'

    if (!id) return json({ error: '缺少 id 参数' }, 400);

    if (action === 'reply') {
      const reply = body as unknown as Reply;
      if (!reply.id || !reply.nickname || !reply.content || !reply.timestamp) {
        return json({ error: '缺少回复必填字段' }, 400);
      }
      await env.DB.prepare(
        'INSERT INTO replies (id, message_id, nickname, content, timestamp) VALUES (?1, ?2, ?3, ?4, ?5)'
      ).bind(reply.id, id, reply.nickname, reply.content, Number(reply.timestamp)).run();
      return json({ success: true });
    }

    if (action === 'like' || action === 'unlike') {
      const row = await env.DB.prepare('SELECT likes, liked_by FROM messages WHERE id = ?1').bind(id).first<{ likes: number; liked_by: string }>();
      if (!row) return json({ error: '留言不存在' }, 404);

      const currentNick = body.nickname as string;
      const likedBy: string[] = JSON.parse(row.liked_by || '[]');

      if (action === 'like') {
        if (!likedBy.includes(currentNick)) {
          likedBy.push(currentNick);
          await env.DB.prepare('UPDATE messages SET likes = likes + 1, liked_by = ?1 WHERE id = ?2')
            .bind(JSON.stringify(likedBy), id).run();
        }
      } else {
        const idx = likedBy.indexOf(currentNick);
        if (idx !== -1) {
          likedBy.splice(idx, 1);
          await env.DB.prepare('UPDATE messages SET likes = MAX(0, likes - 1), liked_by = ?1 WHERE id = ?2')
            .bind(JSON.stringify(likedBy), id).run();
        }
      }
      return json({ success: true });
    }

    return json({ error: '未知操作' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}