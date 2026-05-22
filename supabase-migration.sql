-- 社区留言板 - Supabase 数据库表结构
-- 在 Supabase SQL Editor 中运行此脚本

-- 留言表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}'
);

-- 回复表
CREATE TABLE IF NOT EXISTS replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 300),
  timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引：按时间倒序查询
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_replies_message_id ON replies(message_id);

-- 启用实时订阅（Supabase Realtime）
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE replies;