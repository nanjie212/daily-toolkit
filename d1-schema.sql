-- Cloudflare D1 数据库初始化脚本
-- 用于留言板功能的数据库表

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  likes INTEGER DEFAULT 0,
  liked_by TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- 索引：按时间排序留言
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- 索引：按留言ID查询回复
CREATE INDEX IF NOT EXISTS idx_replies_message_id ON replies(message_id);