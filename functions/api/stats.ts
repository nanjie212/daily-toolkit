// Cloudflare Pages Function - 网站访问统计
// GET  /api/stats  - 返回当前总访问量
// POST /api/stats  - 增加一次访问计数

interface Env {
  DB: D1Database;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  try {
    if (context.request.method === 'GET') {
      const row = await context.env.DB.prepare('SELECT total_visits FROM stats WHERE id = 1').first<{ total_visits: number }>();
      return json({ total_visits: row?.total_visits || 0 });
    }

    if (context.request.method === 'POST') {
      await context.env.DB.prepare(
        'UPDATE stats SET total_visits = total_visits + 1, updated_at = datetime(\'now\') WHERE id = 1'
      ).run();
      const row = await context.env.DB.prepare('SELECT total_visits FROM stats WHERE id = 1').first<{ total_visits: number }>();
      return json({ total_visits: row?.total_visits || 0 });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}