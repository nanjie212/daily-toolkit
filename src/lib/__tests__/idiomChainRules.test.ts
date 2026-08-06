import { describe, it, expect } from 'vitest';
import {
  validateUserMove,
  pickAIMove,
  listAvailableSuccessors,
  countAvailableSuccessors,
  isFourCharChinese,
  matchesChain,
  normalizeDifficulty,
  type IdiomSource,
} from '../idiomChainRules';

/**
 * 用 fixture 构造数据源，完全不依赖真实的 1500 条词库。
 * 同音判定用显式拼音表，避免把 pinyin-pro 的行为也卷进单测。
 */
function makeSource(idioms: string[], pinyin: Record<string, string>): IdiomSource {
  const toneless = (ch: string): string => pinyin[ch] ?? ch;
  return {
    getIdiomsStartingWith(char: string, allowHomophone = false): string[] {
      return idioms.filter((idiom) => {
        const first = [...idiom][0];
        if (first === char) return true;
        return allowHomophone ? toneless(first) === toneless(char) : false;
      });
    },
    isHomophone(a: string, b: string): boolean {
      if (!a || !b) return false;
      return toneless(a) === toneless(b);
    },
  };
}

/** 主 fixture：一张可控的接龙图，其中「尽」是人为留下的死路字。 */
const PINYIN: Record<string, string> = {
  一: 'yi', 意: 'yi', 亿: 'yi',
  心: 'xin', 气: 'qi', 风: 'feng', 发: 'fa', 犹: 'you', 未: 'wei', 尽: 'jin',
  扬: 'yang', 光: 'guang', 大: 'da', 人: 'ren', 深: 'shen', 省: 'sheng',
  味: 'wei', 长: 'chang', 驱: 'qu', 直: 'zhi', 入: 'ru', 鸣: 'ming', 惊: 'jing',
  号: 'hao', 施: 'shi', 令: 'ling', 山: 'shan', 海: 'hai',
};

const IDIOMS = [
  '一心一意', // 一 → 意
  '一鸣惊人', // 一 → 人
  '意气风发', // 意 → 发
  '意犹未尽', // 意 → 尽   ← 「尽」无后继，死路
  '意味深长', // 意 → 长
  '发扬光大', // 发 → 大
  '发人深省', // 发 → 省
  '发号施令', // 发 → 令
  '长驱直入', // 长 → 入
  '人山人海', // 人 → 海
];

const src = makeSource(IDIOMS, PINYIN);

describe('isFourCharChinese / matchesChain（基础判定）', () => {
  it('只有四个汉字才算成语格式合法', () => {
    expect(isFourCharChinese('一心一意')).toBe(true);
    expect(isFourCharChinese('一心一')).toBe(false);
    expect(isFourCharChinese('一心一意啊')).toBe(false);
    expect(isFourCharChinese('abcd')).toBe(false);
    expect(isFourCharChinese('一心1意')).toBe(false);
    expect(isFourCharChinese('')).toBe(false);
  });

  it('首字严格相等或同音都算接上', () => {
    expect(matchesChain('意', '意', src)).toBe(true);
    expect(matchesChain('一', '意', src)).toBe(true); // yi ~ yi
    expect(matchesChain('大', '意', src)).toBe(false);
    expect(matchesChain('', '意', src)).toBe(false);
  });

  it('normalizeDifficulty 对非法值回落到 normal', () => {
    expect(normalizeDifficulty('easy')).toBe('easy');
    expect(normalizeDifficulty('hard')).toBe('hard');
    expect(normalizeDifficulty('normal')).toBe('normal');
    expect(normalizeDifficulty('不存在的难度')).toBe('normal');
    expect(normalizeDifficulty(undefined)).toBe('normal');
  });
});

describe('validateUserMove（用户这一手的校验）', () => {
  it('非四字被拒', () => {
    const r1 = validateUserMove('一心一', '一心一意', new Set(), src);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.error).toContain('四字成语');

    const r2 = validateUserMove('意气风发啊', '一心一意', new Set(), src);
    expect(r2.ok).toBe(false);

    const r3 = validateUserMove('abcd', null, new Set(), src);
    expect(r3.ok).toBe(false);

    const r4 = validateUserMove('   ', null, new Set(), src);
    expect(r4.ok).toBe(false);
    if (!r4.ok) expect(r4.error).toContain('请输入成语');
  });

  it('首字不匹配被拒', () => {
    // 上一手末字是「意」(yi)，「发扬光大」首字「发」(fa) 接不上
    const r = validateUserMove('发扬光大', '一心一意', new Set(), src);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('接龙不匹配');
      expect(r.error).toContain('意');
    }
  });

  it('同音字首字匹配通过（规则1：「意」→「一」可接）', () => {
    const r = validateUserMove('一鸣惊人', '一心一意', new Set(), src);
    expect(r.ok).toBe(true);
  });

  it('严格同字当然也通过', () => {
    expect(validateUserMove('意气风发', '一心一意', new Set(), src).ok).toBe(true);
  });

  it('重复使用被拒（原实现完全缺失该校验）', () => {
    const used = new Set(['意气风发']);
    const r = validateUserMove('意气风发', '一心一意', used, src);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('已经接过');
  });

  it('规则2：不在词库内的四字成语也算过（不再校验 isKnownIdiom）', () => {
    // 「意气用事」不在 fixture 词库里，但四字 + 首字对得上 → 应通过
    expect(IDIOMS).not.toContain('意气用事');
    const r = validateUserMove('意气用事', '一心一意', new Set(), src);
    expect(r.ok).toBe(true);
  });

  it('开局第一手（prevIdiom 为 null）只校验格式与重复', () => {
    expect(validateUserMove('发扬光大', null, new Set(), src).ok).toBe(true);
    expect(validateUserMove('发扬光大', null, new Set(['发扬光大']), src).ok).toBe(false);
  });
});

describe('listAvailableSuccessors / countAvailableSuccessors（前瞻基础）', () => {
  it('能算出未使用的后继，且排除自身与已用词', () => {
    // 「意气风发」末字「发」→ 发扬光大 / 发人深省 / 发号施令
    expect(countAvailableSuccessors('意气风发', new Set(), src)).toBe(3);
    expect(countAvailableSuccessors('意气风发', new Set(['发扬光大']), src)).toBe(2);
    // 「意犹未尽」末字「尽」→ 无
    expect(listAvailableSuccessors('意犹未尽', new Set(), src)).toEqual([]);
  });
});

describe('pickAIMove（AI 一层前瞻）', () => {
  it('能避开死路：给「选 A 会死、选 B 能续」的局面，必须选 B', () => {
    // 只留两个候选：意气风发（末字发，有后继）/ 意犹未尽（末字尽，死路）
    const twoWay = makeSource(['一心一意', '意气风发', '意犹未尽', '发扬光大'], PINYIN);
    const used = new Set(['一心一意']);

    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const move = pickAIMove('一心一意', used, twoWay, difficulty);
      expect('idiom' in move, `${difficulty} 不应判定为死路`).toBe(true);
      if ('idiom' in move) {
        expect(move.idiom, `${difficulty} 选中了死路成语`).toBe('意气风发');
      }
    }
  });

  it('即使把 rng 钉死在会命中死路的位置，也不会选到死路', () => {
    const twoWay = makeSource(['一心一意', '意气风发', '意犹未尽', '发扬光大'], PINYIN);
    const used = new Set(['一心一意']);
    // rng 恒返回 0.99（趋向取候选数组末位，即「意犹未尽」）
    const move = pickAIMove('一心一意', used, twoWay, 'normal', () => 0.99);
    expect('idiom' in move && move.idiom).toBe('意气风发');
  });

  it('真死路时返回 { deadEnd: true } 并带原因', () => {
    // 「发扬光大」末字「大」，fixture 里没有「大」开头的成语
    const move = pickAIMove('发扬光大', new Set(['发扬光大']), src, 'normal');
    expect('deadEnd' in move).toBe(true);
    if ('deadEnd' in move) {
      expect(move.deadEnd).toBe(true);
      expect(move.reason).toContain('大');
    }
  });

  it('所有候选都是死路时，退而求其次仍返回一个成语（不提前判死）', () => {
    // 「意」开头只留一个死路候选「意犹未尽」
    const onlyDead = makeSource(['一心一意', '意犹未尽'], PINYIN);
    const move = pickAIMove('一心一意', new Set(['一心一意']), onlyDead, 'normal');
    expect('idiom' in move).toBe(true);
    if ('idiom' in move) expect(move.idiom).toBe('意犹未尽');
  });

  it('注入固定 rng 后结果可复现', () => {
    const used = new Set(['一心一意']);
    const fixed = () => 0.42;
    const a = pickAIMove('一心一意', used, src, 'normal', fixed);
    const b = pickAIMove('一心一意', used, src, 'normal', fixed);
    const c = pickAIMove('一心一意', used, src, 'normal', fixed);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it('不同 rng 能选出不同候选（证明 rng 真的在起作用）', () => {
    const used = new Set(['一心一意']);
    const first = pickAIMove('一心一意', used, src, 'normal', () => 0);
    const last = pickAIMove('一心一意', used, src, 'normal', () => 0.999);
    expect('idiom' in first).toBe(true);
    expect('idiom' in last).toBe(true);
    if ('idiom' in first && 'idiom' in last) {
      expect(first.idiom).not.toBe(last.idiom);
    }
  });

  it('AI 选出的词永远不是已用过的词', () => {
    const used = new Set(['一心一意', '意气风发', '意犹未尽']);
    const move = pickAIMove('一心一意', used, src, 'normal', () => 0);
    expect('idiom' in move).toBe(true);
    if ('idiom' in move) {
      // 核心断言：绝不复用已用过的词
      expect(used.has(move.idiom)).toBe(false);
      // 一(yī) 与 意(yì) 同音，故「一鸣惊人」也是合法候选；rng=0 时取候选首位
      expect(['一鸣惊人', '意味深长']).toContain(move.idiom);
    }
  });

  it('difficulty：easy 挑后继最多的，hard 挑后继最少但不为 0 的', () => {
    // 候选：一鸣惊人（末字人 → 人山人海，因「人山人海」已用，其后继为 0，视为死路被剔除）、
    //       意气风发（末字发 → 3 个后继）、意味深长（末字长 → 1 个后继）
    const used = new Set(['一心一意', '意犹未尽', '人山人海']);

    const easy = pickAIMove('一心一意', used, src, 'easy', () => 0);
    expect('idiom' in easy && easy.idiom).toBe('意气风发');

    const hard = pickAIMove('一心一意', used, src, 'hard', () => 0);
    expect('idiom' in hard && hard.idiom).toBe('意味深长');
  });

  it('difficulty：hard 也绝不会选到后继为 0 的死路', () => {
    const used = new Set(['一心一意']);
    const hard = pickAIMove('一心一意', used, src, 'hard', () => 0);
    expect('idiom' in hard).toBe(true);
    if ('idiom' in hard) {
      expect(hard.idiom).not.toBe('意犹未尽');
      expect(countAvailableSuccessors(hard.idiom, new Set([...used, hard.idiom]), src)).toBeGreaterThan(0);
    }
  });

  it('上一个成语为空串时判定为死路而不是抛异常', () => {
    const move = pickAIMove('', new Set(), src, 'normal');
    expect('deadEnd' in move).toBe(true);
  });
});
