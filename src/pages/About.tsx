import { builtInTools } from '@/tools';

/**
 * 「关于」页（C2）。
 *
 * 文案来自 PM 的 .cache_a11y/about-content.md，按四节拆成结构化数据 + JSX 渲染，
 * 不塞整段 markdown 字符串，便于后续维护。占位符由运行时代入：
 *   - {TOOL_COUNT}  → builtInTools.length（动态取数，增删工具无需改文案）
 *   - {LAST_UPDATED} → 2026-08-06（发布日期，由 team-lead 指定写死）
 *
 * 文案语气、措辞、合规口径（零对外请求 / 全本地处理）保持 PM 原稿，未做改动。
 */

/** 最后更新日期（team-lead 指定的发布日期）。 */
const LAST_UPDATED = '2026-08-06';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: '我上传的图片、PDF 会被偷偷传到服务器吗？',
    a: '不会。处理全在你的浏览器里完成，文件没离开过设备。不放心可以断网试一次——图片和 PDF 工具照样能用，这就是证明。',
  },
  {
    q: '为什么不用注册？是不是以后要收集我的信息？',
    a: '因为这些工具不需要知道你是谁。没有账号系统，也就没有可收集的东西。',
  },
  {
    q: '底下那个「今日 X 分钟 / 本周 X 分钟」会传出去吗？',
    a: '不会。它只是浏览器在本地记的停留时长，存在你这台设备上，只留最近七天，算给你自己看。代码里没有上传它的路径。换台设备从零开始，清掉缓存就没了。',
  },
  {
    q: '能离线用吗？',
    a: '能。第一次正常打开后页面会被缓存，之后没网也能进。工具本身不依赖网络，断网了照样能算。',
  },
  {
    q: '我的收藏、最近使用、填过的内容存在哪儿？换设备还在吗？',
    a: '都存在当前浏览器里，只对这一台设备有效。换设备、清缓存、用无痕模式，记录都会消失且找不回来。重要内容请自己另存一份。',
  },
  {
    q: '这个站收费吗？以后会不会突然要钱？',
    a: '现在免费，没有会员和付费功能。页面上有捐赠入口，纯自愿，不影响工具使用。',
  },
  {
    q: '意见箱里写的东西会去哪里？',
    a: '意见箱是嵌进来的第三方表单（金数据），这是全站唯一会离开你设备的数据。你点提交，内容就交给那家服务商了。别在里面填身份证号、密码。',
  },
  {
    q: '我发现某个工具算错了，怎么办？',
    a: '请通过意见箱告诉我们，说清是哪个工具、填了什么、得到什么结果。算错了是我们的问题，会去修。',
  },
];

interface DisclaimerItem {
  title: string;
  body: string;
}

const DISCLAIMERS: DisclaimerItem[] = [
  {
    title: '房贷、贷款类计算器',
    body: '按通用公式估算，实际月供和利息以银行核算为准。利率政策会变，本站不保证同步最新。',
  },
  {
    title: '个税、年终奖个税计算器',
    body: '基于现行规则的简化模型。专项附加扣除、多处收入、年度汇算等情况可能算不准，以税务机关口径和实际申报为准。',
  },
  {
    title: 'BMI、体脂率、基础代谢、心率区间等健康类工具',
    body: '只是常用公式的换算结果，不构成医疗建议，不能替代医生的诊断。身体不适请去医院。',
  },
  {
    title: '预产期、经期推算',
    body: '按常规公式估算的参考日期，个体差异很大，具体以医生判断为准。',
  },
  {
    title: '通用说明',
    body: '所有工具的输出仅供参考，我们不保证准确与完整。因使用本站结果造成的任何损失，本站不承担责任。涉及钱、健康、法律的重要决定，请咨询专业人士。',
  },
];

const PRIVACY: string[] = [
  '不收集任何个人信息，没有账号和注册。',
  '站内没有任何第三方统计、广告或追踪脚本。',
  '图片、PDF、文本的处理全部在浏览器内完成，文件不离开你的设备。',
  '收藏、置顶、最近使用、使用时长、部分工具填过的内容，都存在浏览器本地，清缓存即消失。',
  '使用时长只保留最近七天，仅用于显示给你自己看。',
  '唯一的例外是社区意见箱：它是第三方表单（金数据）的嵌入页，你主动提交的内容会交给该服务商，不填就不产生数据。',
  '站点通过 Service Worker 缓存资源以支持离线使用，缓存同样在本地。',
  '除意见箱外，站内代码不向任何外部服务发起网络请求。',
];

export default function About() {
  return (
    <div className="bg-bg min-h-full">
      <section className="px-4 py-12 md:py-16 max-w-3xl mx-auto space-y-12">
        {/* 一、关于这个站 */}
        <section className="space-y-4">
          <h1 className="font-heading font-bold text-white text-2xl md:text-3xl">关于这个站</h1>
          <div className="space-y-3 text-[14px] md:text-[15px] leading-relaxed text-gray-300">
            <p>
              这是一个放在网页上的小工具集合，一共 <strong className="text-white">{builtInTools.length}</strong> 个，分成日常必备、图片与 PDF、趣味娱乐、理财计算、健康生活五类。
            </p>
            <p>
              起因很简单：算个房贷、压张图片、并几个 PDF——事都不难，但每次都要搜个网站，然后被要求注册、登录、开会员，或者等文件慢慢上传再下载。
            </p>
            <p>
              这个站反过来做：打开就用，不注册，不登录，不要邮箱和手机号。计算和文件处理都在你自己的浏览器里跑完，图片和 PDF 不离开你的电脑。第一次打开后页面会被缓存，之后断网也能用。
            </p>
            <p>它不解决什么大问题，就是让这些琐事快一点结束。</p>
          </div>
        </section>

        {/* 二、常见问题 */}
        <section className="space-y-5">
          <h2 className="font-heading font-bold text-white text-xl md:text-2xl">常见问题</h2>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <div key={i} className="bg-card border border-white/5 rounded-2xl p-5 space-y-2">
                <h3 className="text-white font-semibold text-[15px] leading-snug">
                  {i + 1}. {item.q}
                </h3>
                <p className="text-gray-400 text-[14px] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 三、免责声明 */}
        <section className="space-y-5">
          <h2 className="font-heading font-bold text-white text-xl md:text-2xl">免责声明</h2>
          <blockquote className="border-l-2 border-accent/50 pl-4 text-gray-400 text-[14px] italic">
            这些工具用通用公式估个大概，代替不了专业意见。
          </blockquote>
          <div className="space-y-3">
            {DISCLAIMERS.map((item, i) => (
              <div key={i} className="flex gap-3 text-[14px] leading-relaxed">
                <span className="text-accent font-semibold flex-shrink-0">·</span>
                <p className="text-gray-300">
                  <strong className="text-white">{item.title}</strong>：{item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 四、隐私说明 */}
        <section className="space-y-5">
          <h2 className="font-heading font-bold text-white text-xl md:text-2xl">隐私说明</h2>
          <blockquote className="border-l-2 border-accent/50 pl-4 text-gray-400 text-[14px] italic">
            一句话版本：我们不想知道你是谁，技术上也没这么做。
          </blockquote>
          <ul className="space-y-3">
            {PRIVACY.map((item, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-gray-300">
                <span className="text-accent font-semibold flex-shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-gray-600 text-xs pt-2">最后更新：{LAST_UPDATED}</p>
      </section>
    </div>
  );
}
