import type { ToolOutput } from '@/types';
import {
  validateUserMove,
  pickAIMove,
  listAvailableSuccessors,
  normalizeDifficulty,
  lastCharOf,
  type Difficulty,
} from '@/lib/idiomChainRules';
import { idiomSource } from '@/lib/idiomSource';

const foodDB = [
  '🍜 兰州拉面', '🍔 汉堡薯条', '🍕 意大利披萨', '🍣 日式寿司', '🥟 饺子馄饨', '🍛 咖喱饭', '🍲 麻辣火锅', '🥘 石锅拌饭', '🍝 番茄意面', '🌮 墨西哥卷饼',
  '🥗 凯撒沙拉', '🍱 日式便当', '🍗 炸鸡啤酒', '🥩 牛排套餐', '🍤 天妇罗', '🦞 小龙虾', '🍢 关东煮', '🥟 小笼包', '🍜 过桥米线', '🌯 煎饼果子',
  '🥘 黄焖鸡米饭', '🍲 酸菜鱼', '🍛 回锅肉饭', '🍝 炸酱面', '🥟 生煎包', '🍜 螺蛳粉', '🍢 麻辣烫', '🍱 肠粉', '🥩 烤肉拌饭', '🍗 烤鸭',
];

export async function whatToEat(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const cuisine = (input.cuisine as string) || 'all';
    const count = Number(input.count) || 3;
    const filtered = cuisine === 'all'
      ? foodDB
      : foodDB.filter((f) => {
          if (cuisine === 'chinese')
            return f.includes('面') || f.includes('饭') || f.includes('饺') || f.includes('包') || f.includes('粉') || f.includes('锅') || f.includes('汤') || f.includes('鸡') || f.includes('鱼') || f.includes('肉') || f.includes('烤') || f.includes('饼') || f.includes('烫') || f.includes('粉');
          if (cuisine === 'western')
            return f.includes('汉堡') || f.includes('披萨') || f.includes('意面') || f.includes('沙拉') || f.includes('牛排') || f.includes('薯条') || f.includes('墨西哥');
          if (cuisine === 'japanese')
            return f.includes('寿司') || f.includes('便当') || f.includes('天妇罗') || f.includes('拉面') || f.includes('拌饭');
          return true;
        });
    if (filtered.length === 0) return { success: false, error: '该菜系暂无推荐' };
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(count, shuffled.length));
    return {
      success: true,
      data: {
        今天推荐: picks.join('\n'),
        随机指数: `从${filtered.length}道美食中选出${picks.length}个`,
        提示: '不满意？再点一次执行按钮换一批！',
      },
    };
  } catch (e) {
    return { success: false, error: `推荐失败: ${(e as Error).message}` };
  }
}

/**
 * 装饰文字生成器
 * 原理：按风格做字符映射 / 组合符 / 翻转。
 *
 * 修复要点（2026-08）：
 * - 原实现把整句中文当成单个 token、且大量使用 SMP（码位 > U+FFFF）字符，
 *   在 Windows 主流字体下渲染成豆腐块；中文更是原样返回（transformed === text）。
 * - 现抽出纯函数 transformFancyText，不依赖 DOM，便于单测；
 *   字形可用性用 isGlyphSupported 探测，探测失败则自动降级到 BMP 安全替代；
 *   中文输入按风格套用 BMP 内的装饰（括号 / 间隔号 / 组合符等），保证可见变化。
 */

const CJK_RE = /[一-鿿㐀-䶿]/;
function isCJK(c: string): boolean {
  return CJK_RE.test(c);
}

/** 把 ASCII 可打印字符转为全角（BMP 内，中日韩字体必然覆盖）。 */
function toFullwidth(c: string): string {
  const code = c.charCodeAt(0);
  if (code >= 0x21 && code <= 0x7e) return String.fromCharCode(code + 0xfee0);
  if (code >= 0x30 && code <= 0x39) return String.fromCharCode(code - 0x30 + 0xff10);
  return c;
}

/** 气泡圈（BMP，U+24D0 起，主流字体均有）。 */
const BUBBLES: Record<string, string> = { 'a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ','k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ','u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ','A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ','K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ','U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ','0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨' };

/** 方形框（SMP，U+1F130 起，需字形探测 / 降级）。 */
const SQUARES: Record<string, string> = { 'A':'🄰','B':'🄱','C':'🄲','D':'🄳','E':'🄴','F':'🄵','G':'🄶','H':'🄷','I':'🄸','J':'🄹','K':'🄺','L':'🄻','M':'🄼','N':'🄽','O':'🄾','P':'🄿','Q':'🅀','R':'🅁','S':'🅂','T':'🅃','U':'🅄','V':'🅅','W':'🅆','X':'🅇','Y':'🅈','Z':'🅉','a':'🄰','b':'🄱','c':'🄲','d':'🄳','e':'🄴','f':'🄵','g':'🄶','h':'🄷','i':'🄸','j':'🄹','k':'🄺','l':'🄻','m':'🄼','n':'🄽','o':'🄾','p':'🄿','q':'🅀','r':'🅁','s':'🅂','t':'🅃','u':'🅄','v':'🅅','w':'🅆','x':'🅇','y':'🅈','z':'🅉' };

/** 数学粗体（SMP，U+1D41A 起，需字形探测 / 降级）。 */
const MATHBOLD: Record<string, string> = { 'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣','k':'𝐤','l':'𝐥','m':'𝐦','n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭','u':'𝐮','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳','A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌','N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙','0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗' };

/** 翻转映射（字母 + 数字 + 标点；'B' 用 BMP 的 ᗺ U+15FA，比 Deseret 稳妥）。 */
const FLIP: Record<string, string> = {
  'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ','j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z',
  'A':'∀','B':'ᗺ','C':'Ɔ','D':'◖','E':'Ǝ','F':'Ⅎ','G':'⅁','H':'H','I':'I','J':'ſ','K':'⋊','L':'⅂','M':'W','N':'N','O':'O','P':'Ԁ','Q':'Ό','R':'ᴚ','S':'S','T':'⊥','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z',
  '?':'¿','!':'¡','.':'˙',',':"'",'(':')',')':'(','1':'Ɩ','3':'Ɛ','6':'9','7':'ㄥ','9':'6',
};

const ZALGO_MARKS = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030a','\u030b','\u030c','\u030d','\u030e'];

/** 每种风格用于字形探测的样本次（SMP 字符需探测，BMP 字符一般直接可用）。 */
const STYLE_PROBE: Record<string, string> = {
  bubbles: 'ⓐ', // U+24D0 BMP
  squares: '🄰', // U+1F130 SMP
  bold: '𝐚', // U+1D41A SMP
  flip: 'ᗺ', // U+15FA BMP
};

const GLYPH_FONT = "16px 'DM Sans', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Cambria Math', sans-serif";

const glyphCache = new Map<string, boolean>();

/** 创建基于 canvas measureText 的字形宽度测量函数；无 DOM 时返回 null。 */
function createCanvasMeasurer(): ((char: string, font: string) => number) | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return (char: string, font: string) => {
      ctx.font = font;
      return ctx.measureText(char).width;
    };
  } catch {
    return null;
  }
}

/**
 * 探测某个字符在当前环境是否有可用字形。
 * 方法：对比目标字符与「必然缺字形」的私用区字符（\uFFFF）的渲染宽度，宽度相同即判定为豆腐块。
 * - 必须显式设置与页面一致的字体栈（否则测的是 canvas 默认字体，结论无效）。
 * - 无 canvas 环境（vitest / SSR）安全降级返回 true，且不抛异常。
 * - 结果按字符缓存，避免重复测量。
 */
export function isGlyphSupported(
  char: string,
  measurer?: (char: string, font: string) => number,
): boolean {
  try {
    const m = measurer !== undefined ? measurer : createCanvasMeasurer();
    if (!m) return true;
    const cached = glyphCache.get(char);
    if (cached !== undefined) return cached;
    const w = m(char, GLYPH_FONT);
    const wMissing = m('\uFFFF', GLYPH_FONT);
    const supported = w !== wMissing;
    glyphCache.set(char, supported);
    return supported;
  } catch {
    return true;
  }
}

export interface FancyTransformOptions {
  /** 可注入的字形探测函数（测试时传 mock）。缺省则走 canvas 真实探测。 */
  glyphChecker?: (char: string) => boolean;
}

/**
 * 纯函数：把文字按风格转换。不依赖 DOM，便于单测。
 * 返回 { result, note }：note 为降级说明（空串表示未降级）。
 */
export function transformFancyText(
  text: string,
  style: string,
  opts: FancyTransformOptions = {},
): { result: string; note: string } {
  const checker = opts.glyphChecker;
  const styleSupported = (probe: string): boolean => (checker ? checker(probe) : true);

  const chars = [...text];
  const hasCJK = chars.some(isCJK);

  switch (style) {
    case 'bubbles': {
      const supported = styleSupported(STYLE_PROBE.bubbles);
      const fn = (c: string) => (supported ? BUBBLES[c] || c : `【${c}】`);
      const result = chars.map((c) => (isCJK(c) ? `【${c}】` : fn(c))).join('');
      const note = supported ? '' : '你的系统缺少气泡圈字形，已自动降级为方头括号包裹效果';
      return { result, note };
    }
    case 'squares': {
      const supported = styleSupported(STYLE_PROBE.squares);
      const fn = (c: string) => (supported ? SQUARES[c] || c : `〖${c}〗`);
      const result = chars.map((c) => (isCJK(c) ? `〖${c}〗` : fn(c))).join('');
      const note = supported ? '' : '你的系统缺少方形框字形，已自动降级为六角括号包裹效果';
      return { result, note };
    }
    case 'bold': {
      const supported = styleSupported(STYLE_PROBE.bold);
      const mapped = chars.map((c) => (isCJK(c) ? c : supported ? MATHBOLD[c] || c : toFullwidth(c)));
      let result: string;
      if (hasCJK) {
        // 中文无数学粗体字形，用间隔号点缀产生可见变化
        result = mapped
          .map((m, i) => (isCJK(chars[i]) && i > 0 ? '·' + m : m))
          .join('');
      } else {
        result = mapped.join('');
      }
      const note = supported
        ? hasCJK
          ? '中文无数学粗体字形，已用间隔号点缀'
          : ''
        : '你的系统缺少数学粗体字形，已自动降级为全角字符效果';
      return { result, note };
    }
    case 'zalgo': {
      const result = chars
        .map((c) => {
          // 中文叠组合符易错位，数量从 3-7 降到 1-2
          const n = isCJK(c) ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 5);
          let r = c;
          for (let i = 0; i < n; i++) r += ZALGO_MARKS[Math.floor(Math.random() * ZALGO_MARKS.length)];
          return r;
        })
        .join('');
      return { result, note: '' };
    }
    case 'strikethrough': {
      const result = chars.map((c) => c + '\u0336').join('');
      const note = hasCJK ? '删除线为组合符，对中文可能略有错位' : '';
      return { result, note };
    }
    case 'flip': {
      const supported = styleSupported(STYLE_PROBE.flip);
      const reversed = [...chars].reverse();
      // 探测失败则降级为纯反转（仅用 BMP/ASCII，绝不输出豆腐块）
      const result = reversed.map((c) => (supported ? FLIP[c] || c : c)).join('');
      const note = supported ? '' : '你的系统缺少翻转字形，已自动降级为纯反转效果';
      return { result, note };
    }
    default: {
      // 未知风格回落到 bubbles
      const supported = styleSupported(STYLE_PROBE.bubbles);
      const fn = (c: string) => (supported ? BUBBLES[c] || c : `【${c}】`);
      const result = chars.map((c) => (isCJK(c) ? `【${c}】` : fn(c))).join('');
      const note = supported ? '' : '你的系统缺少气泡圈字形，已自动降级为方头括号包裹效果';
      return { result, note };
    }
  }
}

export async function fancyTextGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const style = (input.style as string) || 'bubbles';
    if (!text.trim()) return { success: false, error: '请输入文字' };

    const { result, note } = transformFancyText(text, style, {
      glyphChecker: (c) => isGlyphSupported(c),
    });

    const hint = '点击右上角复制按钮复制转换后的文字' + (note ? `（${note}）` : '');

    return {
      success: true,
      data: { 原文: text, '转换结果': result, 风格: style, 提示: hint },
    };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

export async function specialSymbols(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const mode = (input.mode as string) || 'emoji';

    if (mode === 'emoji') {
      return {
        success: true,
        data: {
          'type': 'emoji-grid',
          '😊 笑脸': '😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙😋😛😜🤪😝🤑🤗🤭🫢🤫🤔🤐🤨😐😑😶🫡😏😒🙄😬😮😯😲😳🥺😢😭😤😡🤬🥱😴🤤😪😵🤯🥴',
          '❤️ 爱心': '❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟♥️❤️‍🔥❤️‍🩹',
          '👍 手势': '👍👎👌✌️🤞🤟🤘🤙👈👉👆👇☝️✋🖐️🖖👋🤚💪🦾🦵🦶👂🦻👃🧠🦷🦴👀👁️👅👄🫦',
          '⭐ 星星': '⭐🌟✨⚡💫🌟🌠⭐🌟✨💫🌟🌈',
          '🎉 庆祝': '🎉🎊🎈🎁🎀🪅🪩🎇🎆✨🎃🎄🎋🎍',
          '☀️ 天气': '☀️🌤️⛅🌥️☁️🌦️🌧️⛈️🌩️🌨️❄️☃️⛄🌬️💨🌪️🌫️🌈☔💧🌊',
        },
      };
    }
    if (mode === 'arrows') {
      return {
        success: true,
        data: {
          'type': 'emoji-grid',
          '↔️ 箭头': '←↑→↓↖↗↘↙↔↕↵↩↪⤴⤵➡️⬅️⬆️⬇️↗️↘️↙️↖️',
          '± 数学': '±×÷≠≈≤≥∞√∑∏∫∂∆∇∈∉⊂⊃∪∩∧∨⊕⊗⊥∠∟⊿⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞',
          '$ 货币': '$¢£¥€₹₩₽₿₨₱₴₪₫₭₮₲₵',
          '® 特殊': '©®™°¹²³¼½¾♯♭♪♫☮⚕⚛☯☪♻♺♼♽⚒⚔⚖☄★☆♔♕♖♗♘♙♚♛♜♝♞♟',
          '⌨ 键盘': '⌘⌥⇧⌃⌫⌦⎋⏎⇥↩↪↵⤴⤵⏫⏬⏪⏩⌂⌛⏳⌚⏰',
        },
      };
    }
    return { success: true, data: { 'type': 'emoji-grid', '提示': '选择表情符号或箭头分组查看' } };
  } catch (e) {
    return { success: false, error: `获取失败: ${(e as Error).message}` };
  }
}

export async function kinshipCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const path = (input.path as string) || '';
    if (!path.trim()) return { success: false, error: '请通过按钮组合生成关系路径' };

    const kinshipMap: Record<string, Record<string, string>> = {
      '我': {
        '爸爸': '爸爸', '妈妈': '妈妈', '哥哥': '哥哥', '弟弟': '弟弟',
        '姐姐': '姐姐', '妹妹': '妹妹', '老公': '老公', '老婆': '老婆',
        '儿子': '儿子', '女儿': '女儿',
      },
      '爸爸': {
        '爸爸': '爷爷', '妈妈': '奶奶', '哥哥': '伯伯', '弟弟': '叔叔',
        '姐姐': '姑妈', '妹妹': '姑姑',
      },
      '妈妈': {
        '爸爸': '外公', '妈妈': '外婆', '哥哥': '舅舅', '弟弟': '舅舅',
        '姐姐': '姨妈', '妹妹': '姨妈',
      },
      '老公': {
        '爸爸': '公公', '妈妈': '婆婆', '哥哥': '大伯子', '弟弟': '小叔子',
        '姐姐': '大姑子', '妹妹': '小姑子',
      },
      '老婆': {
        '爸爸': '岳父', '妈妈': '岳母', '哥哥': '大舅子', '弟弟': '小舅子',
        '姐姐': '大姨子', '妹妹': '小姨子',
      },
      '爷爷': {
        '爸爸': '太爷爷', '妈妈': '太奶奶', '哥哥': '伯祖父', '弟弟': '叔祖父',
        '姐姐': '姑奶奶', '妹妹': '姑奶奶',
      },
      '奶奶': {
        '爸爸': '太外公', '妈妈': '太外婆', '哥哥': '舅爷爷', '弟弟': '舅爷爷',
        '姐姐': '姨奶奶', '妹妹': '姨奶奶',
      },
      '外公': {
        '爸爸': '曾外公', '妈妈': '曾外婆', '哥哥': '舅公', '弟弟': '舅公',
        '姐姐': '姨姥姥', '妹妹': '姨姥姥',
      },
      '外婆': {
        '爸爸': '曾外公', '妈妈': '曾外婆', '哥哥': '舅姥爷', '弟弟': '舅姥爷',
        '姐姐': '姨姥姥', '妹妹': '姨姥姥',
      },
      '儿子': {
        '儿子': '孙子', '女儿': '孙女', '老婆': '儿媳',
      },
      '女儿': {
        '儿子': '外孙', '女儿': '外孙女', '老公': '女婿',
      },
      '孙子': { '儿子': '曾孙', '女儿': '曾孙女' },
      '孙女': { '儿子': '曾外孙', '女儿': '曾外孙女' },
      '哥哥': {
        '儿子': '侄子', '女儿': '侄女', '老婆': '嫂子',
        '爸爸': '爸爸', '妈妈': '妈妈', '爷爷': '爷爷', '奶奶': '奶奶',
      },
      '弟弟': {
        '儿子': '侄子', '女儿': '侄女', '老婆': '弟媳',
        '爸爸': '爸爸', '妈妈': '妈妈', '爷爷': '爷爷', '奶奶': '奶奶',
      },
      '姐姐': {
        '儿子': '外甥', '女儿': '外甥女', '老公': '姐夫',
        '爸爸': '爸爸', '妈妈': '妈妈', '爷爷': '爷爷', '奶奶': '奶奶',
      },
      '妹妹': {
        '儿子': '外甥', '女儿': '外甥女', '老公': '妹夫',
        '爸爸': '爸爸', '妈妈': '妈妈', '爷爷': '爷爷', '奶奶': '奶奶',
      },
      '伯伯': {
        '儿子': '堂兄/堂弟', '女儿': '堂姐/堂妹', '老婆': '伯母',
        '爸爸': '爷爷', '妈妈': '奶奶',
      },
      '叔叔': {
        '儿子': '堂兄/堂弟', '女儿': '堂姐/堂妹', '老婆': '婶婶',
        '爸爸': '爷爷', '妈妈': '奶奶',
      },
      '姑妈': {
        '儿子': '表兄/表弟', '女儿': '表姐/表妹', '老公': '姑父',
        '爸爸': '外公', '妈妈': '外婆',
      },
      '姑姑': {
        '儿子': '表兄/表弟', '女儿': '表姐/表妹', '老公': '姑父',
        '爸爸': '外公', '妈妈': '外婆',
      },
      '舅舅': {
        '儿子': '表兄/表弟', '女儿': '表姐/表妹', '老婆': '舅妈',
        '爸爸': '外公', '妈妈': '外婆',
      },
      '姨妈': {
        '儿子': '表兄/表弟', '女儿': '表姐/表妹', '老公': '姨父',
        '爸爸': '外公', '妈妈': '外婆',
      },
      '嫂子': { '儿子': '侄子', '女儿': '侄女' },
      '弟媳': { '儿子': '侄子', '女儿': '侄女' },
      '姐夫': { '儿子': '外甥', '女儿': '外甥女' },
      '妹夫': { '儿子': '外甥', '女儿': '外甥女' },
      '伯母': { '儿子': '堂兄/堂弟', '女儿': '堂姐/堂妹' },
      '婶婶': { '儿子': '堂兄/堂弟', '女儿': '堂姐/堂妹' },
      '姑父': { '儿子': '表兄/表弟', '女儿': '表姐/表妹' },
      '舅妈': { '儿子': '表兄/表弟', '女儿': '表姐/表妹' },
      '姨父': { '儿子': '表兄/表弟', '女儿': '表姐/表妹' },
    };

    const parts = path.split('的').filter(Boolean);
    if (parts.length < 2) return { success: false, error: '请至少添加一个亲属关系进行计算' };

    let current = parts[0];
    const steps: { from: string; via: string; to: string }[] = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const map = kinshipMap[current];
      if (!map || !map[part]) {
        const joker = randomKinshipJoke(current, part);

        return {
          success: true,
          data: {
            关系路径: path,
            计算结果: joker,
            建议: map ? `从"${current}"可继续的关系有：${Object.keys(map).join('、')}` : '暂无可用关系',
            当前节点: current,
            提示: '选一个上面列出的关系继续试试',
          },
        };
      }
      steps.push({ from: current, via: part, to: map[part] });
      current = map[part];
    }

    const relationType = classifyRelation(parts[0], current);

    return {
      success: true,
      data: {
        关系路径: buildPathDisplay(parts),
        称呼: current,
        关系类型: relationType,
        计算过程: steps.map((s) => `${s.from} → ${s.via} = ${s.to}`).join(' → '),
        提示: current === '我' ? '最终指向自己' : '继续添加关系链可以计算更复杂的称呼',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

function classifyRelation(start: string, end: string): string {
  if (start === end) return '直系';
  const directAscending = ['爸爸', '妈妈', '爷爷', '奶奶', '外公', '外婆', '太爷爷', '太奶奶', '太外公', '太外婆', '曾外公', '曾外婆'];
  const directDescending = ['儿子', '女儿', '孙子', '孙女', '外孙', '外孙女', '曾孙', '曾孙女'];
  const spouse = ['老公', '老婆', '婆婆', '公公', '岳父', '岳母'];
  if (directAscending.includes(end)) return '直系尊亲属';
  if (directDescending.includes(end)) return '直系卑亲属';
  if (spouse.includes(end)) return '姻亲';
  if (end.includes('堂') || end.includes('表')) return '旁系亲属';
  if (end.includes('舅') || end.includes('姑') || end.includes('姨') || end.includes('叔') || end.includes('伯')) return '旁系亲属';
  if (end.includes('嫂') || end.includes('媳') || end.includes('婿') || end.includes('婶') || end.includes('妈')) return '姻亲';
  return '亲属';
}

function buildPathDisplay(parts: string[]): string {
  return parts.join(' → ');
}

const kinshipJokes = [
  (c: string, p: string) => `从"${c}"到"${p}"？直接叫名字就好啦，反正也不常见`,
  (c: string, p: string) => `"${c}"没有"${p}"？交个朋友吧，亲戚不亲戚的随缘`,
  (c: string, p: string) => `"${c}的${p}"这个关系有点绕，微信备注一下比较靠谱`,
  (c: string, p: string) => `咱家${c}族还没发展到"${p}"这么远的关系`,
  (c: string, p: string) => `建议直接问妈妈"${c}的${p}"怎么叫，她肯定知道`,
  (c: string, p: string) => `"${c}的${p}"辈分太乱，建议各论各的`,
  (c: string, p: string) => `这个问题把族谱都难倒了：${c} → ${p}`,
  (c: string, p: string) => `连算法都算不出来的"${c}的${p}"，建议请客吃饭搞定`,
  (c: string, p: string) => `"${c}的${p}"这个亲戚可能住在"朋友圈"里`,
  (c: string, p: string) => `"${c}的${p}"关系太远，一声'嘿'就够了`,
  (c: string, p: string) => `科学家暂时还无法计算从"${c}"到"${p}"的关系`,
  (c: string, p: string) => `"${c}的${p}"这个称呼还没被发明出来`,
  (c: string, p: string) => `"${c}的${p}"比双十一的满减规则还复杂`,
  (c: string, p: string) => `从"${c}"到"${p}"？叫大哥准没错，万能称呼`,
  (c: string, p: string) => `"${c}的${p}" → 见着面了微笑点头即可`,
  (c: string, p: string) => `这就是传说中的"${c}的${p}？八竿子打不着"`,
  (c: string, p: string) => `系统提示：从"${c}"找"${p}"关系链过长，建议充值VIP解锁`,
  (c: string, p: string) => `"${c}的${p}"可能需要先加个微信再论亲戚`,
  (c: string, p: string) => `从"${c}"到"${p}"？叫叔叔阿姨永远不出错`,
  (c: string, p: string) => `别算了，"${c}的${p}"见面直接说'新年好'最安全`,
  (c: string, p: string) => `"${c}的${p}"这个关系大概存在于平行宇宙`,
  (c: string, p: string) => `从"${c}"找到"${p}"？建议双方互相介绍一下`,
  (c: string, p: string) => `"${c}的${p}"已经超出了本计算器的认知范围`,
  (c: string, p: string) => `从"${c}"到"${p}"？叫什么都行，一起吃过饭就是好亲戚`,
  (c: string, p: string) => `"${c}的${p}"这个关系链需要额外付版权费`,
  (c: string, p: string) => `不如直接问"${c}"：'我应该怎么称呼${p}？'`,
  (c: string, p: string) => `"${c}的${p}"关系太复杂，喝顿酒就熟了`,
  (c: string, p: string) => `"${c}的${p}"可能需要查一下家谱才知道怎么叫`,
  (c: string, p: string) => `从"${c}"到"${p}"？建议使用通用称呼：这位亲戚`,
  (c: string, p: string) => `连AI都算不明白"${c}的${p}"，你俩就随缘吧`,
];

function randomKinshipJoke(current: string, part: string): string {
  const idx = Math.floor(Math.random() * kinshipJokes.length);
  return kinshipJokes[idx](current, part);
}

/** 把接龙链渲染成多行文本。用有序数组而非 Set，避免重复项被静默去重导致链条错位。 */
function renderIdiomChain(chain: string[], lastIsAI: boolean): string {
  return chain
    .map((idiom, i) => {
      if (i === 0) return `🟢 ${idiom}`;
      if (i === chain.length - 1 && lastIsAI) return `🤖 ${idiom}`;
      return `    ${idiom}`;
    })
    .join('\n');
}

const IDIOM_LEVEL_NAMES: Record<Difficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
};

/**
 * 成语接龙。
 *
 * 规则与算法全部下沉到 `@/lib/idiomChainRules`（纯函数 + 数据源注入），
 * 本函数只负责「解析输入 → 调规则 → 拼 ToolOutput」，不再内联任何成语数据。
 */
export async function idiomChain(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const start = (input.start as string) || '';
    const history = (input.history as string) || '';
    const difficulty = normalizeDifficulty(input.difficulty as string);

    // 接龙链用「有序数组」维护，Set 只用于 O(1) 去重查询
    const chain: string[] = history ? history.split(/[,，、\s]+/).filter(Boolean) : [];
    const used = new Set<string>(chain);

    // 用户本轮输入的成语
    if (start && start.trim()) {
      const trimmed = start.trim();
      const prev = chain.length > 0 ? chain[chain.length - 1] : null;
      const verdict = validateUserMove(trimmed, prev, used, idiomSource);
      if (!verdict.ok) return { success: false, error: verdict.error };
      chain.push(trimmed);
      used.add(trimmed);
    }

    if (chain.length === 0) {
      return {
        success: true,
        type: 'idiom-chain',
        data: {
          状态: '🎮 请输入一个成语开始接龙',
          规则: '任意四字成语都可以，不必在词库内；AI 会用你成语的末字（同音字也算）接龙',
          提示: '例如输入"一心一意"，AI 会接"意"或同音"一/亿/易"开头的成语',
        },
      };
    }

    const prevIdiom = chain[chain.length - 1];
    const move = pickAIMove(prevIdiom, used, idiomSource, difficulty);

    // AI 无词可接：本局结束
    if ('deadEnd' in move) {
      return {
        success: true,
        type: 'idiom-chain',
        data: {
          接龙链: renderIdiomChain(chain, false),
          状态: '😢 接龙结束',
          原因: move.reason,
          已接: `${chain.length} 个`,
          提示: '换个成语重新开始吧！',
        },
      };
    }

    chain.push(move.idiom);
    used.add(move.idiom);

    const nextChar = lastCharOf(move.idiom);
    // 只看「真正还剩下的未使用后继」，不再叠加那个让判断几乎恒为真的冗余分支
    const nextCandidates = listAvailableSuccessors(move.idiom, used, idiomSource);
    const hasNext = nextCandidates.length > 0;

    return {
      success: true,
      type: 'idiom-chain',
      data: {
        接龙链: renderIdiomChain(chain, true),
        AI接龙: move.idiom,
        下一字: nextChar,
        难度: IDIOM_LEVEL_NAMES[difficulty],
        已接: `${chain.length} 个`,
        状态: hasNext
          ? `✅ 请以"${nextChar}"或其同音字开头继续`
          : `⚠️ "${nextChar}"已无可接成语，本局到此为止`,
        提示: hasNext
          ? `输入以"${nextChar}"开头的四字成语，同音字也算接上`
          : '可以结束，或换一个成语重新开始',
      },
    };
  } catch (e) { return { success: false, error: `接龙失败: ${(e as Error).message}` }; }
}

export async function memeTextGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const style = (input.style as string) || 'impact';
    if (!text.trim()) return { success: false, error: '请输入文字' };

    const styles: Record<string, { font: string; color: string; stroke: string; bg: string; desc: string }> = {
      impact: { font: 'bold 48px Impact, sans-serif', color: '#ffffff', stroke: '#000000', bg: '#transparent', desc: '经典表情包风格(白字黑边)' },
      meme: { font: 'bold 40px "Comic Sans MS", cursive', color: '#ffffff', stroke: '#333333', bg: '#transparent', desc: '卡通 meme 风格' },
      retro: { font: 'bold 44px "Courier New", monospace', color: '#00ff00', stroke: '#003300', bg: '#000000', desc: '复古终端绿屏风格' },
      cute: { font: 'bold 38px "华文楷体", "KaiTi", serif', color: '#ff69b4', stroke: '#ffffff', bg: '#ffebf5', desc: '可爱粉色风格' },
      dramatic: { font: 'bold 52px "SimHei", "黑体", sans-serif', color: '#ff4444', stroke: '#000000', bg: '#transparent', desc: '戏剧夸张红字风格' },
    };

    const s = styles[style] || styles.impact;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    if (s.bg !== '#transparent') {
      ctx.fillStyle = s.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = s.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (s.stroke) {
      ctx.strokeStyle = s.stroke;
      ctx.lineWidth = 4;
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    }

    ctx.fillStyle = s.color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('生成失败'))), 'image/png');
    });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: { 文字: text, 风格: s.desc, 提示: '已生成表情包文字图片，可下载后添加到表情包上' },
      downloadUrl,
      filename: 'meme-text.png',
    };
  } catch (e) { return { success: false, error: `生成失败: ${(e as Error).message}` }; }
}