import type { ToolOutput } from '@/types';

const foodDB = [
  '🍜 兰州拉面', '🍔 汉堡薯条', '🍕 意大利披萨', '🍣 日式寿司', '🥟 饺子馄饨', '🍛 咖喱饭', '🍲 麻辣火锅', '🥘 石锅拌饭', '🍝 番茄意面', '🌮 墨西哥卷饼',
  '🥗 凯撒沙拉', '🍱 日式便当', '🍗 炸鸡啤酒', '🥩 牛排套餐', '🍤 天妇罗', '🦞 小龙虾', '🍢 关东煮', '🥟 小笼包', '🍜 过桥米线', '🌯 煎饼果子',
  '🥘 黄焖鸡米饭', '🍲 酸菜鱼', '🍛 回锅肉饭', '🍝 炸酱面', '🥟 生煎包', '🍜 螺蛳粉', '🍢 麻辣烫', '🍱 肠粉', '🥩 烤肉拌饭', '🍗 烤鸭',
];

const chineseIdioms: string[] = [
  '一心一意', '三心二意', '四面八方', '五光十色', '六神无主', '七上八下', '八仙过海', '九牛一毛',
  '十全十美', '百发百中', '千钧一发', '万马奔腾', '胸有成竹', '画龙点睛', '守株待兔', '对牛弹琴',
  '狐假虎威', '鸟语花香', '龙飞凤舞', '马到成功', '如鱼得水', '亡羊补牢', '鹤立鸡群', '鹏程万里',
  '一鸣惊人', '三顾茅庐', '四面楚歌', '卧薪尝胆', '破釜沉舟', '背水一战', '纸上谈兵', '围魏救赵',
];

const kinshipMap: Record<string, Record<string, string>> = {
  '我': { '爸爸': '爸爸', '妈妈': '妈妈', '哥哥': '哥哥', '弟弟': '弟弟', '姐姐': '姐姐', '妹妹': '妹妹' },
  '爸爸': { '爸爸': '爷爷', '妈妈': '奶奶', '哥哥': '伯伯', '弟弟': '叔叔', '姐姐': '姑姑', '妹妹': '姑姑' },
  '妈妈': { '爸爸': '外公', '妈妈': '外婆', '哥哥': '舅舅', '弟弟': '舅舅', '姐姐': '阿姨', '妹妹': '阿姨' },
  '伯伯': { '儿子': '堂哥/堂弟', '女儿': '堂姐/堂妹' },
  '叔叔': { '儿子': '堂哥/堂弟', '女儿': '堂姐/堂妹' },
  '姑姑': { '儿子': '表哥/表弟', '女儿': '表姐/表妹' },
  '舅舅': { '儿子': '表哥/表弟', '女儿': '表姐/表妹' },
  '阿姨': { '儿子': '表哥/表弟', '女儿': '表姐/表妹' },
};

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

export async function fancyTextGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = (input.text as string) || '';
    const style = (input.style as string) || 'bubbles';
    if (!text.trim()) return { success: false, error: '请输入文字' };

    const transformers: Record<string, (t: string) => string> = {
      bubbles: (t) => [...t].map(c => {
        const map: Record<string, string> = { 'a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ','k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ','u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ','A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ','K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ','U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ','0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨' };
        return map[c] || c;
      }).join(''),
      squares: (t) => [...t].map(c => {
        const map: Record<string, string> = { 'A':'🄰','B':'🄱','C':'🄲','D':'🄳','E':'🄴','F':'🄵','G':'🄶','H':'🄷','I':'🄸','J':'🄹','K':'🄺','L':'🄻','M':'🄼','N':'🄽','O':'🄾','P':'🄿','Q':'🅀','R':'🅁','S':'🅂','T':'🅃','U':'🅄','V':'🅅','W':'🅆','X':'🅇','Y':'🅈','Z':'🅉','a':'🄰','b':'🄱','c':'🄲','d':'🄳','e':'🄴','f':'🄵','g':'🄶','h':'🄷','i':'🄸','j':'🄹','k':'🄺','l':'🄻','m':'🄼','n':'🄽','o':'🄾','p':'🄿','q':'🅀','r':'🅁','s':'🅂','t':'🅃','u':'🅄','v':'🅅','w':'🅆','x':'🅇','y':'🅈','z':'🅉' };
        return map[c] || c;
      }).join(''),
      zalgo: (t) => [...t].map(c => {
        const marks = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030a','\u030b','\u030c','\u030d','\u030e'];
        let r = c;
        const n = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < n; i++) r += marks[Math.floor(Math.random() * marks.length)];
        return r;
      }).join(''),
      strikethrough: (t) => [...t].map(c => c + '\u0336').join(''),
      flip: (t) => {
        const map: Record<string, string> = { 'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ','j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','A':'∀','B':'𐐒','C':'Ɔ','D':'◖','E':'Ǝ','F':'Ⅎ','G':'⅁','H':'H','I':'I','J':'ſ','K':'⋊','L':'⅂','M':'W','N':'N','O':'O','P':'Ԁ','Q':'Ό','R':'ᴚ','S':'S','T':'⊥','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z' };
        return [...t].reverse().map(c => map[c] || c).join('');
      },
      bold: (t) => {
        const map: Record<string, string> = { 'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣','k':'𝐤','l':'𝐥','m':'𝐦','n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭','u':'𝐮','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳','A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌','N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙','0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗' };
        return [...t].map(c => map[c] || c).join('');
      },
    };

    const transformed = (transformers[style] || transformers.bubbles)(text);

    return {
      success: true,
      data: { 原文: text, '转换结果': transformed, 风格: style, 提示: '点击右上角复制按钮复制转换后的文字' },
    };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}

export async function specialSymbols(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const mode = (input.mode as string) || 'emoji';
    const emojiData: Record<string, string> = {};

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
          '↔️ 箭头': '←↑→↓↖↗↘↙↔↕↵↩↪⤴⤵↰↱↲↳↴↵⏎➡️⬅️⬆️⬇️↗️↘️↙️↖️⬆️⬇️➡️⬅️↕↔',
          '± 数学': '±×÷≠≈≤≥∞√∑∏∫∂∆∇∈∉⊂⊃∪∩∧∨⊕⊗⊥∠∟⊿⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞',
          '$ 货币': '$¢£¥€₹₩₽₿₨₱₴₪₫₭₮₲₵',
          '® 特殊': '©®™℠°¹²³¼½¾№℗℞℧℮ℹ™℠℀℁℅℆№℗℞℧℮ℹ™',
          '⌨ 键盘': '⌘⌥⇧⌃⌫⌦⎋⏎⇥⇤⇞⇟⎀⎁⎂⎃⎄⎅⎆⎇⎈⎉⎊⎋⏏⏭⏮⏯⏴⏵⏶⏷⏸⏹⏺⏻⏼⏽⏾',
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
      '哥哥': { '儿子': '侄子', '女儿': '侄女', '老婆': '嫂子' },
      '弟弟': { '儿子': '侄子', '女儿': '侄女', '老婆': '弟媳' },
      '姐姐': { '儿子': '外甥', '女儿': '外甥女', '老公': '姐夫' },
      '妹妹': { '儿子': '外甥', '女儿': '外甥女', '老公': '妹夫' },
      '爷爷': { '哥哥': '伯祖父', '弟弟': '叔祖父', '姐姐': '姑奶奶', '妹妹': '姑奶奶' },
      '奶奶': { '哥哥': '舅爷爷', '弟弟': '舅爷爷', '姐姐': '姨奶奶', '妹妹': '姨奶奶' },
      '伯伯': { '儿子': '堂兄/堂弟', '女儿': '堂姐/堂妹' },
      '叔叔': { '儿子': '堂兄/堂弟', '女儿': '堂姐/堂妹' },
      '姑妈': { '儿子': '表兄/表弟', '女儿': '表姐/表妹' },
      '姑姑': { '儿子': '表兄/表弟', '女儿': '表姐/表妹' },
      '舅舅': { '儿子': '表兄/表弟', '女儿': '表姐/表妹' },
      '姨妈': { '儿子': '表兄/表弟', '女儿': '表姐/表妹' },
    };

    const parts = path.split('的').filter(Boolean);
    let current = '我';
    for (const part of parts) {
      const map = kinshipMap[current];
      if (!map || !map[part]) {
        return { success: true, data: { 关系路径: path, 计算过程: `从"${current}"找不到"${part}"的关系`, 提示: '暂不支持该关系计算' } };
      }
      current = map[part];
    }

    return {
      success: true,
      data: { '关系路径': path, '称呼': current, '关系类型': path === current ? '直系亲属' : '亲戚', 提示: '继续添加关系链以计算更复杂的称呼' },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function idiomChain(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const start = (input.start as string) || '';
    const difficulty = (input.difficulty as string) || 'normal';
    const idiomDB: Record<string, string[]> = {
      一: ['一心一意','一见如故','一马当先','一鸣惊人','一目十行','一诺千金','一针见血','一落千丈'],
      心: ['心花怒放','心想事成','心旷神怡','心直口快','心血来潮','心猿意马'],
      马: ['马到成功','马不停蹄','马首是瞻'],
      人: ['人山人海','人声鼎沸','人尽其才','人面桃花','人言可畏'],
      天: ['天长地久','天翻地覆','天衣无缝','天马行空','天涯海角'],
      大: ['大公无私','大器晚成','大同小异','大刀阔斧','大智若愚'],
      万: ['万无一失','万众一心','万象更新','万紫千红'],
      千: ['千钧一发','千丝万缕','千锤百炼','千载难逢'],
      百: ['百发百中','百花齐放','百折不挠','百感交集'],
      龙: ['龙飞凤舞','龙马精神','龙腾虎跃','龙争虎斗'],
      风: ['风和日丽','风调雨顺','风华正茂','风驰电掣'],
      花: ['花好月圆','花团锦簇','花言巧语','花枝招展'],
      日: ['日新月异','日积月累','日理万机'],
      水: ['水落石出','水深火热','水到渠成','水滴石穿'],
      山: ['山清水秀','山穷水尽','山盟海誓'],
      金: ['金碧辉煌','金玉满堂','金榜题名','金枝玉叶'],
      火: ['火冒三丈','火眼金睛'],
      不: ['不可思议','不翼而飞','不屈不挠','不约而同'],
      自: ['自强不息','自告奋勇','自力更生','自言自语'],
      无: ['无微不至','无与伦比','无可奈何','无穷无尽'],
      出: ['出类拔萃','出人头地','出口成章'],
      画: ['画龙点睛','画蛇添足','画饼充饥'],
      虎: ['虎头蛇尾','虎视眈眈','虎口余生'],
    };

    const firstChar = start.slice(-1);
    const candidates = idiomDB[firstChar] || [];
    if (candidates.length === 0) {
      return { success: true, data: { 接龙结束: `找不到以"${firstChar}"开头的成语`, 已用字数: `${start.length}`, 提示: '试试换一个成语开头!' } };
    }

    const pool = difficulty === 'easy' ? candidates : candidates.filter(c => c.length >= 4);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || candidates[0];

    const levelNames: Record<string, string> = { easy: '简单', normal: '普通', hard: '困难' };
    const combo = start.replace(/[，,、\s]+/g, '').length / 4;

    return {
      success: true,
      data: {
        '你的开头': start,
        'AI接龙': chosen,
        '难度': levelNames[difficulty] || '普通',
        '接龙次数': `第 ${Math.floor(combo) + 1} 轮`,
        '下一字': `请以"${chosen.slice(-1)}"开头继续`,
        '提示': `输入以"${chosen.slice(-1)}"开头的成语继续接龙`,
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