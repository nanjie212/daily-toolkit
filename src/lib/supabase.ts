import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export { isConfigured };

export interface CommunityMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  likes: number;
  liked_by: string[];
}

export interface Reply {
  id: string;
  message_id: string;
  nickname: string;
  content: string;
  timestamp: number;
}

const LOCAL_MSGS_KEY = 'toolbox_community_messages';
const LOCAL_LIKES_KEY = 'toolbox_community_likes';

function getLocalMessages(): Record<string, CommunityMessage> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_MSGS_KEY) || '{}');
  } catch { return {}; }
}

function saveLocalMessages(msgs: Record<string, CommunityMessage>) {
  try { localStorage.setItem(LOCAL_MSGS_KEY, JSON.stringify(msgs)); } catch {}
}

function getLocalLikes(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LIKES_KEY) || '{}');
  } catch { return {}; }
}

function saveLocalLikes(likes: Record<string, number>) {
  try { localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(likes)); } catch {}
}

export async function fetchMessages(): Promise<CommunityMessage[]> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: false });
    if (!error && data) return data as CommunityMessage[];
  }
  const msgs = getLocalMessages();
  return Object.values(msgs).sort((a, b) => b.timestamp - a.timestamp);
}

export async function addMessage(nickname: string, content: string): Promise<void> {
  const msg: CommunityMessage = {
    id: crypto.randomUUID(),
    nickname,
    content,
    timestamp: Date.now(),
    likes: 0,
    liked_by: [],
  };

  if (isConfigured && supabase) {
    const { error } = await supabase.from('messages').insert(msg);
    if (!error) return;
  }

  const msgs = getLocalMessages();
  msgs[msg.id] = msg;
  saveLocalMessages(msgs);
}

export async function toggleLike(messageId: string): Promise<boolean> {
  const nickname = localStorage.getItem('toolbox_nickname') || '匿名用户';

  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('likes, liked_by')
      .eq('id', messageId)
      .single();

    if (!error && data) {
      const likedBy = data.liked_by || [];
      const alreadyLiked = likedBy.includes(nickname);
      const newLikedBy = alreadyLiked
        ? likedBy.filter((n: string) => n !== nickname)
        : [...likedBy, nickname];
      const newLikes = alreadyLiked ? (data.likes || 1) - 1 : (data.likes || 0) + 1;

      await supabase
        .from('messages')
        .update({ likes: Math.max(0, newLikes), liked_by: newLikedBy })
        .eq('id', messageId);

      return !alreadyLiked;
    }
  }

  const msgs = getLocalMessages();
  const msg = msgs[messageId];
  if (!msg) return false;

  const alreadyLiked = msg.liked_by.includes(nickname);
  if (alreadyLiked) {
    msg.liked_by = msg.liked_by.filter(n => n !== nickname);
    msg.likes = Math.max(0, msg.likes - 1);
  } else {
    msg.liked_by.push(nickname);
    msg.likes += 1;
  }
  saveLocalMessages(msgs);
  return !alreadyLiked;
}

export async function fetchReplies(messageId: string): Promise<Reply[]> {
  if (isConfigured && supabase) {
    const { data, error } = await supabase
      .from('replies')
      .select('*')
      .eq('message_id', messageId)
      .order('timestamp', { ascending: true });
    if (!error && data) return data as Reply[];
  }

  try {
    const all = JSON.parse(localStorage.getItem('toolbox_replies') || '{}');
    return (all[messageId] || []).sort((a: Reply, b: Reply) => a.timestamp - b.timestamp);
  } catch { return []; }
}

export async function addReply(messageId: string, nickname: string, content: string): Promise<void> {
  const reply: Reply = {
    id: crypto.randomUUID(),
    message_id: messageId,
    nickname,
    content,
    timestamp: Date.now(),
  };

  if (isConfigured && supabase) {
    const { error } = await supabase.from('replies').insert(reply);
    if (!error) return;
  }

  try {
    const all = JSON.parse(localStorage.getItem('toolbox_replies') || '{}');
    if (!all[messageId]) all[messageId] = [];
    all[messageId].push(reply);
    localStorage.setItem('toolbox_replies', JSON.stringify(all));
  } catch {}
}

export function isNicknameLiked(message: CommunityMessage): boolean {
  const nickname = localStorage.getItem('toolbox_nickname') || '匿名用户';
  return (message.liked_by || []).includes(nickname);
}