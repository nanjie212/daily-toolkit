/**
 * 成语接龙规则引擎。
 *
 * 设计要点：
 * - **纯函数 + 数据源注入**：本模块不 import 任何成语数据，全部通过 `IdiomSource` 注入。
 *   这样单测可以用十几条 fixture 构造出精确的接龙图（含人为死路），
 *   既不依赖真实的 1500 条词库，也不会因为词库内容变动而让测试变脆。
 * - **rng 注入**：所有随机选择走传入的 `rng`，默认 `Math.random`，便于测试复现。
 *
 * 用户拍板的三条新规则：
 * 1. 同音字也算接龙成功（「意」→「一」可接）。
 * 2. 只要是四字、且首字对得上就算过，**不再要求成语必须在词库内**。
 * 3. 词库扩至 1500 条（由 `@/data/idioms` 提供，与本模块解耦）。
 */

/** 接龙数据源契约。实现见 `@/lib/idiomSource`（生产）与单测 fixture（测试）。 */
export interface IdiomSource {
  /**
   * 取以 `char` 开头的成语。
   * @param allowHomophone 为 true 时，同音字开头的成语也一并返回。
   */
  getIdiomsStartingWith(char: string, allowHomophone?: boolean): string[];
  /** 判断两个汉字是否同音（忽略声调）。 */
  isHomophone(a: string, b: string): boolean;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export type ValidateResult = { ok: true; error?: undefined } | { ok: false; error: string };

export type AIMoveResult = { idiom: string } | { deadEnd: true; reason: string };

/** 成语固定长度：四字。 */
export const IDIOM_LENGTH = 4;

/**
 * 汉字范围：CJK 统一表意文字（U+4E00–U+9FFF）+ 扩展 A 区（U+3400–U+4DBF）。
 * 两段都在 BMP 内，覆盖现代成语用字；极生僻的扩展 B 区（SMP）字符不在成语库中，不予支持。
 */
const CJK_ONLY_RE = /^[\u4e00-\u9fff\u3400-\u4dbf]+$/;

/** 取字符串首字（按码点，避免代理对被截断）。 */
export function firstCharOf(text: string): string {
  return [...text][0] ?? '';
}

/** 取字符串末字（按码点）。 */
export function lastCharOf(text: string): string {
  const chars = [...text];
  return chars.length > 0 ? chars[chars.length - 1] : '';
}

/** 是否为「四个汉字」。这是新规则下唯一的成语格式要求（不再校验是否在词库内）。 */
export function isFourCharChinese(text: string): boolean {
  return [...text].length === IDIOM_LENGTH && CJK_ONLY_RE.test(text);
}

/**
 * 判断首字能否接上一个成语的末字。
 * 严格相等或同音（忽略声调）均视为接上——这是用户拍板的规则 1。
 */
export function matchesChain(inputFirst: string, expectedLast: string, src: IdiomSource): boolean {
  if (!inputFirst || !expectedLast) return false;
  if (inputFirst === expectedLast) return true;
  return src.isHomophone(inputFirst, expectedLast);
}

/**
 * 校验用户这一手是否合法。
 *
 * 校验顺序（顺序即错误提示的优先级，越靠前越「基础」）：
 * 1. 非空
 * 2. 四个汉字（新规则 2：**不再校验是否在词库内**）
 * 3. 未被使用过（修复原实现完全缺失重复校验、可无限接同一个成语的问题）
 * 4. 首字接得上（新规则 1：同音字也算）
 *
 * @param prevIdiom 上一个成语；为 `null` 表示这是开局第一手，只做格式与重复校验。
 */
export function validateUserMove(
  input: string,
  prevIdiom: string | null,
  used: Set<string>,
  src: IdiomSource,
): ValidateResult {
  const trimmed = (input || '').trim();

  if (!trimmed) {
    return { ok: false, error: '请输入成语' };
  }

  if (!isFourCharChinese(trimmed)) {
    return { ok: false, error: `"${trimmed}" 不是四字成语，请输入四个汉字` };
  }

  if (used.has(trimmed)) {
    return { ok: false, error: `"${trimmed}" 已经接过了，换一个吧` };
  }

  if (prevIdiom) {
    const expectedLast = lastCharOf(prevIdiom);
    const inputFirst = firstCharOf(trimmed);
    if (!matchesChain(inputFirst, expectedLast, src)) {
      return {
        ok: false,
        error: `接龙不匹配：需要以"${expectedLast}"或其同音字开头，但"${trimmed}"以"${inputFirst}"开头`,
      };
    }
  }

  return { ok: true };
}

/**
 * 列出某个成语「还能往下接」的所有未使用成语（同音字计入）。
 * 既用于 AI 的一层前瞻打分，也用于对外判断 `hasNext`。
 */
export function listAvailableSuccessors(
  idiom: string,
  used: Set<string>,
  src: IdiomSource,
): string[] {
  const last = lastCharOf(idiom);
  if (!last) return [];
  return src
    .getIdiomsStartingWith(last, true)
    .filter((candidate) => candidate !== idiom && !used.has(candidate));
}

/** 未使用后继的数量。 */
export function countAvailableSuccessors(
  idiom: string,
  used: Set<string>,
  src: IdiomSource,
): number {
  return listAvailableSuccessors(idiom, used, src).length;
}

/** 从数组中按注入的 rng 取一个元素（对越界结果做钳制，防止 rng 返回 1）。 */
function pickRandom<T>(arr: T[], rng: () => number): T {
  const raw = Math.floor(rng() * arr.length);
  const index = Math.min(Math.max(raw, 0), arr.length - 1);
  return arr[index];
}

/**
 * 取排序后的「头部梯队」，用于 easy / hard 在保持难度倾向的同时保留一定随机性。
 * 梯队大小 = ceil(n / 3)，至少 1 个。
 */
function topTier<T>(sorted: T[]): T[] {
  return sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 3)));
}

interface ScoredCandidate {
  idiom: string;
  /** 该候选被选中后，下一手还剩多少可接成语（一层前瞻）。 */
  successors: number;
}

/**
 * AI 选词——带**一层前瞻**。
 *
 * 原实现是纯随机（`pool[Math.floor(Math.random() * pool.length)]`），
 * 经常自己接一个末字是死胡同的成语，导致游戏立刻结束——这是「游戏坏了」的主因。
 *
 * 现策略：
 * 1. 取所有以上一手末字（含同音）开头、且未使用的候选。
 * 2. 对每个候选做一层前瞻：假设选它之后，它的末字还剩几个未使用的后继。
 * 3. 只在 `successors > 0`（即不是死路）的候选里挑；
 *    仅当**所有**候选都是死路时，才退而求其次随机选一个（此时下一轮自然结束）。
 * 4. 难度决定在「活候选」里怎么挑，见 README 式说明：
 *    - `easy`：挑后继**最多**的（玩家可选空间最大 → 最好接）
 *    - `normal`：在活候选里纯随机
 *    - `hard`：挑后继**最少**但仍 > 0 的（把玩家逼到窄路，但不会当场结束游戏）
 *
 * 说明：难度没有采用「常见成语优先」的方案，因为数据模块契约里不提供词频/常见度字段，
 * 无法客观判定「常见」；而「后继数量」是同一份数据里可直接算出的客观量，
 * 且与玩家的实际难感受单调相关，作为难度轴更合理也更可测。
 */
export function pickAIMove(
  prevIdiom: string,
  used: Set<string>,
  src: IdiomSource,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): AIMoveResult {
  const last = lastCharOf(prevIdiom);
  if (!last) {
    return { deadEnd: true, reason: '上一个成语无效，无法继续接龙' };
  }

  const candidates = src
    .getIdiomsStartingWith(last, true)
    .filter((candidate) => candidate !== prevIdiom && !used.has(candidate));

  if (candidates.length === 0) {
    return { deadEnd: true, reason: `没有以"${last}"或其同音字开头的未使用成语了` };
  }

  // 一层前瞻打分：注意要把候选自身也计入 used，否则会把自己算成自己的后继。
  const scored: ScoredCandidate[] = candidates.map((idiom) => {
    const nextUsed = new Set(used);
    nextUsed.add(idiom);
    return { idiom, successors: listAvailableSuccessors(idiom, nextUsed, src).length };
  });

  const alive = scored.filter((s) => s.successors > 0);

  // 所有候选都是死路——只能退而求其次，至少让本轮能接上。
  if (alive.length === 0) {
    return { idiom: pickRandom(candidates, rng) };
  }

  if (difficulty === 'easy') {
    // 稳定排序：后继多的优先
    const sorted = [...alive].sort((a, b) => b.successors - a.successors);
    return { idiom: pickRandom(topTier(sorted), rng).idiom };
  }

  if (difficulty === 'hard') {
    // 稳定排序：后继少（但 > 0）的优先
    const sorted = [...alive].sort((a, b) => a.successors - b.successors);
    return { idiom: pickRandom(topTier(sorted), rng).idiom };
  }

  // normal：活候选里纯随机
  return { idiom: pickRandom(alive, rng).idiom };
}

/** 把任意输入规整为合法难度，非法值回落到 normal。 */
export function normalizeDifficulty(value: string | undefined | null): Difficulty {
  return value === 'easy' || value === 'hard' ? value : 'normal';
}
