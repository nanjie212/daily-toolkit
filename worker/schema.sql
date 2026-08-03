-- 云端共享留言板 — Cloudflare D1 (SQLite) 建表语句
-- 用法：
--   wrangler d1 execute daily_toolkit_community --local=false --file=worker/schema.sql
--
-- 说明：
--   * 使用 SQLite 语法（无 UUID 类型，主键用 TEXT；自增用 INTEGER PRIMARY KEY）
--   * 时间统一用 INTEGER 存 epoch 毫秒（created_at）
--   * liked_by / encouraged_by 用 TEXT 存 JSON 数组（存储点赞/鼓励过的设备 ID，用于去重）
--   * status 默认 'visible'，管理操作置 'hidden'（软删除，保留数据，不物理删除）

-- 留言主表
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT    PRIMARY KEY,
  nickname      TEXT    NOT NULL DEFAULT '匿名用户',
  content       TEXT    NOT NULL,
  likes         INTEGER NOT NULL DEFAULT 0,
  encourages    INTEGER NOT NULL DEFAULT 0,
  liked_by      TEXT    NOT NULL DEFAULT '[]',
  encouraged_by TEXT    NOT NULL DEFAULT '[]',
  status        TEXT    NOT NULL DEFAULT 'visible',
  created_at    INTEGER NOT NULL
);

-- 回复表
CREATE TABLE IF NOT EXISTS replies (
  id         TEXT    PRIMARY KEY,
  message_id TEXT    NOT NULL,
  nickname   TEXT    NOT NULL DEFAULT '匿名用户',
  content    TEXT    NOT NULL,
  created_at INTEGER NOT NULL
);

-- 限流计数器表（按 deviceId|IP 维度 + 时间窗口计数）
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT    PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status     ON messages (status);
CREATE INDEX IF NOT EXISTS idx_replies_message_id  ON replies (message_id);
