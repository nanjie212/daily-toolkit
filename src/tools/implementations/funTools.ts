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
        const suggestions = map
          ? Object.keys(map).map((k) => `${k}→${map[k]}`).join('、')
          : '暂无可用关系';

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

export async function idiomChain(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const start = (input.start as string) || '';
    const history = (input.history as string) || '';
    const difficulty = (input.difficulty as string) || 'normal';

    // 扩充成语数据库（100+成语，覆盖更多首字）
    const idiomDB: Record<string, string[]> = {
      一: ['一心一意','一见如故','一马当先','一鸣惊人','一目十行','一诺千金','一针见血','一落千丈','一帆风顺','一举两得','一丝不苟','一言九鼎','一触即发','一尘不染','一箭双雕','一鼓作气'],
      心: ['心花怒放','心想事成','心旷神怡','心直口快','心血来潮','心猿意马','心满意足','心照不宣','心花怒放'],
      马: ['马到成功','马不停蹄','马首是瞻','马革裹尸'],
      人: ['人山人海','人声鼎沸','人尽其才','人面桃花','人言可畏','人杰地灵','人才济济'],
      天: ['天长地久','天翻地覆','天衣无缝','天马行空','天涯海角','天花乱坠','天经地义'],
      大: ['大公无私','大器晚成','大同小异','大刀阔斧','大智若愚','大快人心','大显身手'],
      万: ['万无一失','万众一心','万象更新','万紫千红','万水千山'],
      千: ['千钧一发','千丝万缕','千锤百炼','千载难逢','千变万化','千军万马'],
      百: ['百发百中','百花齐放','百折不挠','百感交集','百步穿杨','百年大计'],
      龙: ['龙飞凤舞','龙马精神','龙腾虎跃','龙争虎斗','龙凤呈祥'],
      风: ['风和日丽','风调雨顺','风华正茂','风驰电掣','风平浪静','风雨同舟','风花雪月'],
      花: ['花好月圆','花团锦簇','花言巧语','花枝招展','花前月下'],
      日: ['日新月异','日积月累','日理万机','日上三竿'],
      水: ['水落石出','水深火热','水到渠成','水滴石穿','水乳交融'],
      山: ['山清水秀','山穷水尽','山盟海誓','山高水长'],
      金: ['金碧辉煌','金玉满堂','金榜题名','金枝玉叶'],
      火: ['火冒三丈','火眼金睛','火中取栗'],
      不: ['不可思议','不翼而飞','不屈不挠','不约而同','不劳而获','不言而喻','不寒而栗'],
      自: ['自强不息','自告奋勇','自力更生','自言自语','自相矛盾'],
      无: ['无微不至','无与伦比','无可奈何','无穷无尽','无中生有','无价之宝'],
      出: ['出类拔萃','出人头地','出口成章','出其不意'],
      画: ['画龙点睛','画蛇添足','画饼充饥'],
      虎: ['虎头蛇尾','虎视眈眈','虎口余生','虎背熊腰'],
      意: ['意气风发','意味深长','意想不到','意气用事'],
      故: ['故步自封','故弄玄虚'],
      先: ['先发制人','先入为主','先见之明'],
      到: ['到岸舍筏'],
      成: ['成竹在胸','成千上万','成家立业'],
      功: ['功成名就','功德无量'],
      前: ['前功尽弃','前车之鉴','前仆后继'],
      行: ['行云流水','行尸走肉'],
      十: ['十全十美','十拿九稳','十万火急'],
      目: ['目不转睛','目瞪口呆','目中无人'],
      诺: ['诺诺连声'],
      针: ['针锋相对'],
      血: ['血口喷人','血本无归'],
      落: ['落花流水','落井下石','落落大方'],
      鸣: ['鸣锣开道'],
      惊: ['惊天动地','惊弓之鸟','惊慌失措','惊喜交加'],
      尽: ['尽心尽力','尽善尽美'],
      如: ['如虎添翼','如鱼得水','如火如荼','如雷贯耳'],
      海: ['海阔天空','海底捞月','海纳百川'],
      声: ['声东击西','声色俱厉'],
      沸: ['沸沸扬扬'],
      才: ['才高八斗','才华横溢'],
      桃: ['桃李满天下'],
      畏: ['畏首畏尾'],
      翻: ['翻天覆地'],
      缝: ['缝衣浅带'],
      空: ['空前绝后','空穴来风'],
      角: ['角巾私第'],
      缘: ['缘木求鱼'],
      公: ['公而忘私','公平合理'],
      晚: ['晚节不保'],
      异: ['异想天开','异曲同工'],
      刀: ['刀光剑影'],
      愚: ['愚公移山'],
      快: ['快马加鞭'],
      身: ['身临其境','身体力行','身败名裂'],
      失: ['失之交臂'],
      众: ['众志成城','众所周知'],
      象: ['象齿焚身'],
      红: ['红杏出墙'],
      丝: ['丝丝入扣'],
      变: ['变化无常','变本加厉'],
      军: ['军令如山'],
      发: ['发愤图强','发人深省'],
      中: ['中流砥柱'],
      步: ['步步为营','步人后尘','步步登高'],
      折: ['折戟沉沙'],
      感: ['感人肺腑'],
      舞: ['舞文弄墨'],
      精: ['精益求精','精打细算'],
      腾: ['腾云驾雾'],
      争: ['争分夺秒'],
      斗: ['斗志昂扬','斗转星移'],
      呈: ['呈花一现'],
      平: ['平步青云','平分秋色'],
      静: ['静如处子'],
      同: ['同甘共苦','同舟共济'],
      月: ['月下老人'],
      上: ['上行下效'],
      理: ['理直气壮','理屈词穷'],
      乳: ['乳臭未干'],
      交: ['交口称赞'],
      穿: ['穿针引线'],
      高: ['高瞻远瞩','高枕无忧'],
      长: ['长驱直入','长年累月'],
      盟: ['盟山誓海'],
      碧: ['碧血丹心'],
      玉: ['玉洁冰清'],
      榜: ['榜上有名'],
      枝: ['枝繁叶茂'],
      叶: ['叶落归根'],
      栗: ['栗栗危惧'],
      劳: ['劳苦功高','劳师动众'],
      言: ['言简意赅','言不由衷','言传身教'],
      寒: ['寒气逼人'],
      约: ['约法三章'],
      告: ['告老还乡'],
      相: ['相辅相成','相依为命','相机行事'],
      矛: ['矛盾重重'],
      生: ['生龙活虎','生机勃勃','生灵涂炭'],
      价: ['价值连城'],
      宝: ['宝刀不老'],
      其: ['其乐无穷'],
      弄: ['弄巧成拙','弄虚作假'],
      虚: ['虚张声势','虚怀若谷'],
      封: ['封妻荫子'],
      主: ['主客颠倒'],
      见: ['见义勇为','见多识广'],
      云: ['云消雾散'],
      雨: ['雨过天晴','雨后春笋'],
      草: ['草木皆兵'],
      后: ['后来居上'],
      仆: ['仆仆风尘'],
      继: ['继往开来'],
      全: ['全心全意'],
      美: ['美不胜收','美轮美奂'],
      拿: ['拿手好戏'],
      急: ['急中生智'],
      转: ['转危为安'],
      睛: ['睛天霹雳'],
      呆: ['呆若木鸡'],
      东: ['东张西望','东山再起'],
      西: ['西装革履'],
      弓: ['弓弩手'],
      鸟: ['鸟语花香'],
      慌: ['慌不择路'],
      地: ['地大物博'],
      善: ['善始善终'],
      力: ['力不从心','力挽狂澜'],
      临: ['临危不惧'],
      体: ['体贴入微'],
      河: ['河清海晏'],
      阔: ['阔步前进'],
      底: ['海底捞针'],
      纳: ['纳谏如流'],
      纵: ['纵横交错'],
      色: ['色厉内荏'],
      厉: ['厉兵秣马'],
      甘: ['甘之如饴'],
      舟: ['舟车劳顿'],
      济: ['济世之才'],
      老: ['老马识途','老当益壮'],
      下: ['下笔成章'],
      效: ['效犬马力'],
      直: ['直截了当'],
      壮: ['壮志凌云'],
      愤: ['愤世嫉俗'],
      图: ['图穷匕见'],
      省: ['省吃俭用'],
      口: ['口若悬河','口是心非'],
      称: ['称心如意'],
      赞: ['赞不绝口'],
      文: ['文质彬彬','文武双全'],
      墨: ['墨守成规'],
      益: ['精益求精'],
      打: ['打草惊蛇'],
      瞻: ['瞻前顾后'],
      远: ['远见卓识'],
      忧: ['忧心忡忡'],
      枕: ['枕戈待旦'],
      驱: ['驱虎吞狼'],
      入: ['入木三分'],
      年: ['年富力强'],
      累: ['累卵之危'],
      志: ['志同道合'],
      昂: ['昂首阔步'],
      分: ['分秒必争'],
      营: ['营私舞弊'],
      载: ['载歌载舞'],
      沉: ['沉鱼落雁'],
      锋: ['锋芒毕露'],
      义: ['义不容辞','义正词严'],
      勇: ['勇往直前'],
      多: ['多才多艺','多谋善断'],
      识: ['识时务者为俊杰'],
      消: ['消声匿迹'],
      散: ['散兵游勇'],
      过: ['过河拆桥'],
      春: ['春风化雨','春暖花开'],
      笋: ['笋冻不解'],
      木: ['木已成舟'],
      兵: ['兵不厌诈','兵贵神速'],
      居: ['居高临下'],
      望: ['望梅止渴','望尘莫及'],
      张: ['张灯结彩','张冠李戴','张口结舌'],
      再: ['再接再厉'],
      装: ['装聋作哑'],
      革: ['革故鼎新'],
      履: ['履险如夷'],
      犬: ['犬马之劳'],
      虏: ['虏获人心'],
      涂: ['涂脂抹粉'],
      茂: ['茂林修竹'],
      拔: ['拔苗助长'],
      危: ['危言耸听','危在旦夕'],
      惧: ['惧怕心理'],
      逼: ['逼上梁山'],
      横: ['横行霸道','横冲直撞'],
      狂: ['狂风暴雨'],
      辞: ['辞旧迎新'],
      容: ['容光焕发'],
      连: ['连绵不断'],
      城: ['城狐社鼠'],
      知: ['知足常乐','知己知彼'],
      俗: ['俗不可耐'],
      简: ['简明扼要'],
      由: ['由表及里'],
      衷: ['衷心感谢'],
      传: ['传为佳话'],
      败: ['败军之将'],
      名: ['名不虚传','名落孙山'],
      结: ['结党营私'],
      怕: ['怕死贪生'],
      策: ['策马奔腾'],
      奔: ['奔走相告'],
    };

    // 解析接龙历史
    // history 格式: "成语1,成语2,成语3" 或空
    const usedIdioms = new Set<string>();
    let lastChar = '';

    if (history) {
      const histList = history.split(/[,，、\s]+/).filter(Boolean);
      histList.forEach(idiom => usedIdioms.add(idiom));
      if (histList.length > 0) {
        lastChar = histList[histList.length - 1].slice(-1);
      }
    }

    // 如果用户输入了新的起始成语
    if (start && start.trim()) {
      usedIdioms.add(start.trim());
      lastChar = start.trim().slice(-1);
    }

    if (!lastChar) {
      return {
        success: true,
        type: 'idiom-chain',
        data: {
          状态: '🎮 请输入一个成语开始接龙',
          规则: 'AI会用你成语的最后一个字开头，接一个新成语',
          提示: '例如输入"一心一意"，AI会接"意"开头的成语',
        },
      };
    }

    // 查找可用成语
    const candidates = (idiomDB[lastChar] || []).filter(idiom => !usedIdioms.has(idiom));

    if (candidates.length === 0) {
      // 检查是否根本没有这个字开头的成语
      const allCandidates = idiomDB[lastChar] || [];
      if (allCandidates.length === 0) {
        return {
          success: true,
          type: 'idiom-chain',
          data: {
            状态: '😢 接龙结束',
            原因: `成语库中没有以"${lastChar}"开头的成语`,
            已接: `${usedIdioms.size} 个`,
            提示: '换个成语重新开始吧！',
          },
        };
      }
      return {
        success: true,
        type: 'idiom-chain',
        data: {
          状态: '😢 接龙结束',
          原因: `"${lastChar}"开头的成语都用完了`,
          已接: `${usedIdioms.size} 个`,
          提示: '换个成语重新开始吧！',
        },
      };
    }

    // 根据难度筛选
    let pool = candidates;
    if (difficulty === 'hard') {
      pool = candidates.filter(c => c.length === 4);
    }
    if (pool.length === 0) pool = candidates;

    // 随机选择一个
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    usedIdioms.add(chosen);

    const nextChar = chosen.slice(-1);
    const nextCandidates = (idiomDB[nextChar] || []).filter(idiom => !usedIdioms.has(idiom));
    const hasNext = nextCandidates.length > 0 || (idiomDB[nextChar] || []).length > 0;

    const levelNames: Record<string, string> = { easy: '简单', normal: '普通', hard: '困难' };
    const chainCount = usedIdioms.size;

    // 构建接龙链展示
    const chainList = [...usedIdioms];
    const chainDisplay = chainList.map((idiom, i) => {
      if (i === 0) return `🟢 ${idiom}`;
      if (i === chainList.length - 1) return `🤖 ${idiom}`;
      return `    ${idiom}`;
    }).join('\n');

    return {
      success: true,
      type: 'idiom-chain',
      data: {
        接龙链: chainDisplay,
        AI接龙: chosen,
        下一字: nextChar,
        难度: levelNames[difficulty] || '普通',
        已接: `${chainCount} 个`,
        状态: hasNext ? `✅ 请以"${nextChar}"开头继续` : `⚠️ "${nextChar}"可能无法继续`,
        提示: hasNext ? `在输入框输入以"${nextChar}"开头的成语` : '可以结束或换一个成语',
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