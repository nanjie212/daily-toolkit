-- Cloudflare D1 数据库初始化脚本
-- v2.0 — 新增访问统计和留言鼓励功能

-- 留言表
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  likes INTEGER DEFAULT 0,
  liked_by TEXT DEFAULT '[]',
  encourages INTEGER DEFAULT 0,
  encouraged_by TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 回复表
CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- 访问统计表
CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_visits INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO stats (id, total_visits) VALUES (1, 0);

-- 索引
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_replies_message_id ON replies(message_id);

-- ⚠️ 如果你之前已经创建过数据库，请运行以下迁移语句：
-- ALTER TABLE messages ADD COLUMN encourages INTEGER DEFAULT 0;
-- ALTER TABLE messages ADD COLUMN encouraged_by TEXT DEFAULT '[]';
-- CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY DEFAULT 1, total_visits INTEGER DEFAULT 0, updated_at TEXT DEFAULT (datetime('now')));
-- INSERT OR IGNORE INTO stats (id, total_visits) VALUES (1, 0);