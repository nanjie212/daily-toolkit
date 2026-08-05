import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  InboxIcon,
  MessageCircleIcon,
  ExternalLinkIcon,
  SparklesIcon,
} from 'lucide-react';
import { getFeedbackFormUrl, isFeedbackConfigured } from '@/lib/feedbackConfig';
import { communityResponses, type CommunityResponse } from '@/data/communityResponses';

/**
 * 社区意见箱页面（纯静态，零后端）。
 *
 * ## 为什么不再是「实时留言墙」
 * 前两版分别用自建 Serverless 后端与国内 BaaS 云数据库：前者默认域名在大陆被墙，
 * 后者要求站长（非技术背景）完成实名认证、手工建表、配置一堆权限，维护成本过高。
 * 现改为「第三方表单 + 静态回应区」：
 *
 *   - **A 区 意见箱**：内嵌金数据 / 腾讯问卷等第三方表单的 iframe。
 *     用户填写与提交全部发生在第三方域内，本项目**不发起任何网络请求、不持有任何凭据**。
 *   - **B 区 站长回应区**：读取 `src/data/communityResponses.ts` 的静态数组。
 *     站长从表单后台导出真实意见后，手动挑选、脱敏、附回应，再提交代码发布。
 *
 * 因此本文件不含任何 fetch / localStorage 草稿 / 点赞 / 回复逻辑 —— 它只是两块展示区。
 *
 * ## 布局说明（2026-08 改版）
 * 移动 / 平板（< lg）单列纵向堆叠：页头 → 意见箱（上）→ 站长回应区（下）。
 * 桌面端（>= lg）左右双栏：左栏倾斜给第三方表单更多宽度（minmax(0,…) 防止 iframe 撑破 grid），
 * 右栏站长回应区 `sticky` 跟随，列表过长时内部滚动，避免布局塌陷。
 */

/** iframe 的 sandbox 白名单：允许表单正常运行与提交，但禁止其操纵顶层窗口。 */
const IFRAME_SANDBOX = 'allow-forms allow-scripts allow-same-origin allow-popups';

/** 单条「意见 + 站长回应」卡片。 */
function ResponseCard({ item }: { item: CommunityResponse }) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl p-4 transition-all hover:border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-accent">
          {item.nickname.slice(0, 1) || '匿'}
        </div>
        <span className="font-medium text-sm text-gray-200">{item.nickname}</span>
        {item.date ? <span className="text-xs text-gray-600">{item.date}</span> : null}
      </div>

      <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{item.content}</p>

      {item.reply ? (
        <div className="mt-3 pl-3 border-l-2 border-accent/40 bg-surface/40 rounded-r-xl py-2 pr-3">
          <div className="flex items-center gap-1.5 mb-1">
            <SparklesIcon className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">站长回应</span>
          </div>
          <p className="text-gray-300 text-xs whitespace-pre-wrap break-words">{item.reply}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const formUrl = getFeedbackFormUrl();
  const configured = isFeedbackConfigured();
  const responses = communityResponses;

  return (
    <div className="min-h-full p-6 lg:p-8 space-y-6">
      {/* ---------- 页头（顶部通栏，不参与分栏） ---------- */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          aria-label="返回"
          className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">社区意见箱</h1>
          <p className="text-gray-400 text-sm">提建议、报 Bug、说想法，站长都会看</p>
        </div>
      </div>

      {/* ---------- 双栏：左=意见箱 / 右=站长回应区（lg 及以上） ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
        {/* ---------- A 区：意见箱（第三方表单） ---------- */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <InboxIcon className="w-4 h-4" />
            <span>意见箱</span>
          </div>

          {configured ? (
            <div className="bg-card border border-white/5 rounded-2xl p-2 sm:p-3 space-y-3">
              <iframe
                src={formUrl}
                title="意见反馈表单"
                loading="lazy"
                sandbox={IFRAME_SANDBOX}
                className="w-full h-[460px] lg:h-[520px] rounded-xl border border-white/10 bg-white"
              />
              <div className="flex justify-center">
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface text-gray-400 text-xs hover:text-accent hover:bg-white/5 transition-all"
                >
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                  <span>表单显示异常？在新窗口打开</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-white/5 rounded-2xl p-8 text-center space-y-3">
              <InboxIcon className="w-12 h-12 mx-auto text-gray-600 opacity-50" />
              <h2 className="text-lg font-heading font-semibold text-white">意见箱即将开放</h2>
              <p className="text-sm text-gray-400">站长正在接入意见收集表单，稍候~</p>
              <div className="pt-1">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface text-gray-500 text-sm opacity-50 cursor-not-allowed"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  <span>联系站长</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ---------- B 区：站长回应区（静态数据，桌面端 sticky 跟随） ---------- */}
        <section className="space-y-3 lg:sticky lg:top-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MessageCircleIcon className="w-4 h-4" />
            <span>站长回应区{responses.length > 0 ? ` · ${responses.length} 条` : ''}</span>
          </div>

          {responses.length > 0 ? (
            <div className="space-y-3 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-1">
              {responses.map((item) => (
                <ResponseCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <MessageCircleIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base">还没有回应，欢迎来提~</p>
              <p className="text-xs mt-1">你的意见被采纳后，会出现在这一栏</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
