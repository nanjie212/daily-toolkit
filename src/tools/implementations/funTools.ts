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
    const text = input.text as string;
    const style = (input.style as string) || 'bold';
    if (!text?.trim()) return { success: false, error: '请输入文本' };
    const charMaps: Record<string, Record<string, string>> = {
      bold: { A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇' },
      italic: { A:'𝘈',B:'𝘉',C:'𝘊',D:'𝘋',E:'𝘌',F:'𝘍',G:'𝘎',H:'𝘏',I:'𝘐',J:'𝘑',K:'𝘒',L:'𝘓',M:'𝘔',N:'𝘕',O:'𝘖',P:'𝘗',Q:'𝘘',R:'𝘙',S:'𝘚',T:'𝘛',U:'𝘜',V:'𝘝',W:'𝘞',X:'𝘟',Y:'𝘠',Z:'𝘡',a:'𝘢',b:'𝘣',c:'𝘤',d:'𝘥',e:'𝘦',f:'𝘧',g:'𝘨',h:'𝘩',i:'𝘪',j:'𝘫',k:'𝘬',l:'𝘭',m:'𝘮',n:'𝘯',o:'𝘰',p:'𝘱',q:'𝘲',r:'𝘳',s:'𝘴',t:'𝘵',u:'𝘶',v:'𝘷',w:'𝘸',x:'𝘹',y:'𝘺',z:'𝘻' },
      fancy: { A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃' },
    };
    const map = charMaps[style] || charMaps.bold;
    const result = text.split('').map((c) => map[c] || c).join('');
    const stylesCN: Record<string, string> = { bold: '粗体', italic: '斜体', fancy: '花体' };
    return {
      success: true,
      data: {
        原文: text,
        风格: stylesCN[style] || style,
        转换结果: result,
        提示: '复制结果即可在微信、微博等平台使用',
      },
    };
  } catch (e) {
    return { success: false, error: `生成失败: ${(e as Error).message}` };
  }
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
    const relation = (input.relation as string) || '';
    if (!relation) return { success: false, error: '请输入关系，如：爸爸的哥哥' };
    const parts = relation.split(/[的之]/);
    let current = '我';
    for (const part of parts) {
      const map = kinshipMap[current];
      if (!map || !map[part]) {
        return { success: false, error: `暂不支持"${relation}"的计算` };
      }
      current = map[part];
    }
    return {
      success: true,
      data: {
        关系描述: relation,
        你应该叫: current,
        提示: '输入例如"爸爸的哥哥"，来算亲戚该怎么称呼。仅支持常见直系亲属关系。',
      },
    };
  } catch (e) {
    return { success: false, error: `计算失败: ${(e as Error).message}` };
  }
}

export async function idiomChain(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const word = input.word as string;
    if (!word?.trim()) return { success: false, error: '请输入一个成语' };
    const lastChar = word[word.length - 1];
    const matches = chineseIdioms.filter((i) => i[0] === lastChar && i !== word);
    if (matches.length === 0) {
      return {
        success: true,
        data: {
          你的成语: word,
          接龙结果: '暂无收录以"' + lastChar + '"开头的成语',
          提示: '试试其他结尾字的成语',
        },
      };
    }
    const next = matches[Math.floor(Math.random() * matches.length)];
    return {
      success: true,
      data: {
        你的成语: word,
        接: `→ ${next}`,
        可接成语数: `${matches.length} 个`,
        备选: matches.slice(0, 5).join('、'),
        提示: '点击再执行可换一个接龙结果',
      },
    };
  } catch (e) {
    return { success: false, error: `接龙失败: ${(e as Error).message}` };
  }
}

export async function memeTextGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const topText = input.topText as string;
    const bottomText = input.bottomText as string;
    const style = (input.style as string) || 'impact';
    if (!topText && !bottomText) return { success: false, error: '请至少输入一行文字' };
    const styles: Record<string, string> = {
      impact: 'IMPACT字体风格',
      heart: '甜蜜恋爱风格',
      rage: '暴怒吐槽风格',
      sad: '无奈心酸风格',
      happy: '快乐沙雕风格',
    };
    return {
      success: true,
      data: {
        上方文字: topText || '（未填）',
        下方文字: bottomText || '（未填）',
        风格: styles[style] || style,
        生成模板: `[${styles[style] || style}]\n${topText || ''}\n---\n${bottomText || ''}`,
        提示: '此为文字模板生成，可在微信表情包制作工具中使用此文案',
      },
    };
  } catch (e) {
    return { success: false, error: `生成失败: ${(e as Error).message}` };
  }
}