import { useState, useEffect, useCallback, useRef } from 'react';
import { HeartIcon, SendIcon, ReplyIcon, TrashIcon, MessageCircleIcon, SmileIcon, ChevronUpIcon, ArrowLeftIcon } from 'lucide-react';
import { safeStorage } from '@/lib/safeStorage';
import { fetchMessages, addMessage, toggleLike, addReply, isNicknameLiked, isConfigured } from '@/lib/supabase';

interface Reply {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
}

interface Message {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  liked_by: string[];
  replies: Reply[];
}

const randomNicks = ['快乐的小鸟', '阳光下的猫', '随风而行', '星空漫步者', '午后红茶', '薄荷糖', '蔚蓝海岸', '竹林听雨', '晨曦微露', '北方的狼', '小鱼儿', '追风少年'];

function genNickname(): string {
  return randomNicks[Math.floor(Math.random() * randomNicks.length)] + Math.floor(Math.random() * 100);
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 259200000) return `${Math.floor(diff / 86400000)} 天前`;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Community() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState(() => safeStorage.getJSON<string>('toolbox_community_nickname', '') || genNickname());
  const [content, setContent] = useState('');
  const [nickEditing, setNickEditing] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'hottest'>('newest');
  const [showSuccess, setShowSuccess] = useState(false);
  const msgListRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const msgs = await fetchMessages() as Message[];
      const enriched = await Promise.all(msgs.map(async (msg) => {
        if (!msg.replies) {
          const { fetchReplies } = await import('@/lib/supabase');
          msg.replies = await fetchReplies(msg.id) as Reply[];
        }
        return msg;
      }));
      setMessages(enriched);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSaveNick = () => {
    safeStorage.setJSON('toolbox_community_nickname', nickname);
    setNickEditing(false);
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) return;

    await addMessage(nickname || '匿名用户', trimmed);
    setContent('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    loadMessages();
  };

  const handleLike = async (msgId: string) => {
    await toggleLike(msgId);
    loadMessages();
  };

  const handleDelete = (msgId: string) => {
    if (isConfigured) return;
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    const local = safeStorage.getJSON<Message[]>('toolbox_community_messages', []);
    safeStorage.setJSON('toolbox_community_messages', local.filter((m) => m.id !== msgId));
  };

  const handleReply = async (msgId: string) => {
    const trimmed = replyContent.trim();
    if (!trimmed || trimmed.length > 300) return;
    await addReply(msgId, nickname || '匿名用户', trimmed);
    setReplyTo(null);
    setReplyContent('');
    loadMessages();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sorted = [...messages].sort((a, b) => {
    if (sortOrder === 'hottest') return (b.likes || 0) - (a.likes || 0) || b.timestamp - a.timestamp;
    return b.timestamp - a.timestamp;
  });

  const nickColors = ['text-emerald-400', 'text-blue-400', 'text-purple-400', 'text-pink-400', 'text-amber-400', 'text-cyan-400', 'text-rose-400'];

  const getNickColor = (nick: string) => {
    let hash = 0;
    for (let i = 0; i < nick.length; i++) hash = nick.charCodeAt(i) + ((hash << 5) - hash);
    return nickColors[Math.abs(hash) % nickColors.length];
  };

  return (
    <div className="min-h-full p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            aria-label="返回"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">社区留言板</h1>
            <p className="text-gray-400 text-sm">
              {isConfigured ? '留言已同步到云端，所有用户可见' : '留言仅保存在本地（配置云存储后可全网可见）'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface rounded-xl p-1">
          <button
            onClick={() => setSortOrder('newest')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortOrder === 'newest' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white'}`}
          >
            最新
          </button>
          <button
            onClick={() => setSortOrder('hottest')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortOrder === 'hottest' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white'}`}
          >
            最热
          </button>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <SmileIcon className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 flex items-center gap-2">
            {nickEditing ? (
              <div className="flex items-center gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                  onBlur={handleSaveNick}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNick()}
                  className="w-28 px-2 py-1 bg-surface border border-accent/30 rounded-lg text-white text-sm focus:outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setNickEditing(true)}
                className={`text-sm font-medium hover:underline ${getNickColor(nickname)}`}
              >
                {nickname || '匿名用户'}
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            placeholder="写下你想说的话...（按 Enter 发送，Shift+Enter 换行）"
            rows={3}
            className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 resize-none text-sm"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={`text-xs ${content.length > 450 ? 'text-red-400' : 'text-gray-600'}`}>
              {content.length}/500
            </span>
            <button
              onClick={handleSend}
              disabled={!content.trim()}
              className="p-2 rounded-lg bg-accent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition-all active:scale-95"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showSuccess && (
          <div className="text-center text-accent text-sm animate-fade-in">✨ 发送成功！</div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <MessageCircleIcon className="w-4 h-4" />
          <span>
            {loading ? '加载中...' : `共 ${messages.length} 条留言`}
            {isConfigured && <span className="text-[10px] text-accent/60 ml-2">· 云端同步中</span>}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-white/5 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-surface" />
                  <div className="h-3 w-20 bg-surface rounded" />
                  <div className="h-2 w-12 bg-surface rounded" />
                </div>
                <div className="h-3 w-full bg-surface rounded mb-2" />
                <div className="h-3 w-3/4 bg-surface rounded" />
              </div>
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div ref={msgListRef} className="space-y-3">
            {sorted.map((msg) => {
              const liked = isNicknameLiked(msg);
              return (
                <div key={msg.id} className="bg-card border border-white/5 rounded-2xl p-4 transition-all hover:border-white/10 group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-bold ${getNickColor(msg.nickname)}`}>
                        {msg.nickname[0]}
                      </div>
                      <span className={`font-medium text-sm ${getNickColor(msg.nickname)}`}>
                        {msg.nickname}
                      </span>
                      <span className="text-xs text-gray-600">{formatTime(msg.timestamp)}</span>
                    </div>
                    {!isConfigured && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="删除"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-gray-200 text-sm whitespace-pre-wrap break-words mb-3">{msg.content}</p>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(msg.id)}
                      className={`flex items-center gap-1.5 text-xs transition-all active:scale-125 ${
                        liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                      }`}
                    >
                      <HeartIcon className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                      <span>{(msg.likes || 0) > 0 ? msg.likes : '赞'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setReplyTo(replyTo === msg.id ? null : msg.id);
                        setReplyContent('');
                      }}
                      className={`flex items-center gap-1.5 text-xs transition-all ${
                        replyTo === msg.id ? 'text-accent' : 'text-gray-500 hover:text-accent'
                      }`}
                    >
                      <ReplyIcon className="w-3.5 h-3.5" />
                      <span>{(msg.replies || []).length > 0 ? msg.replies.length : '回复'}</span>
                    </button>
                  </div>

                  {replyTo === msg.id && (
                    <div className="mt-3 pl-2 border-l-2 border-accent/30 animate-fade-in">
                      <div className="flex gap-2">
                        <input
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value.slice(0, 300))}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(msg.id); } }}
                          placeholder="写下回复..."
                          className="flex-1 px-3 py-2 bg-surface border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50"
                          autoFocus
                        />
                        <button
                          onClick={() => handleReply(msg.id)}
                          disabled={!replyContent.trim()}
                          className="px-3 py-2 rounded-lg bg-accent/20 text-accent text-sm disabled:opacity-30 hover:bg-accent/30 transition-all"
                        >
                          <SendIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.replies && msg.replies.length > 0 && (
                    <div className="mt-3 space-y-2 pl-4 border-l border-white/5">
                      {msg.replies.map((reply) => (
                        <div key={reply.id} className="bg-surface/50 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${getNickColor(reply.nickname)}`}>{reply.nickname}</span>
                            <span className="text-[10px] text-gray-600">{formatTime(reply.timestamp)}</span>
                          </div>
                          <p className="text-gray-300 text-xs whitespace-pre-wrap break-words">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <MessageCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">还没有留言</p>
            <p className="text-sm mt-1">成为第一个发言的人吧！</p>
          </div>
        )}

        {messages.length > 10 && (
          <button
            onClick={() => msgListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 right-6 z-40 p-3 rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-all"
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}