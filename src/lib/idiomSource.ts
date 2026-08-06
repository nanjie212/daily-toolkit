/**
 * 生产环境的接龙数据源适配器：把 `@/data/idioms` 绑定到 `IdiomSource` 契约上。
 *
 * 单独抽一层的原因：
 * - `idiomChainRules.ts` 必须保持对数据零依赖（纯函数 + 注入），才能用 fixture 做精确单测；
 * - 而 `funTools.ts` 与 `IdiomChainGame.tsx` 两个消费方都需要「真实数据源」，
 *   放在这里可以避免两处重复粘同一段适配代码。
 */
import { getIdiomsStartingWith, isHomophone } from '@/data/idioms';
import type { IdiomSource } from './idiomChainRules';

export const idiomSource: IdiomSource = {
  /** 默认放开同音字：接龙规则 1 要求同音也算接上。 */
  getIdiomsStartingWith(char: string, allowHomophone = true): string[] {
    return [...getIdiomsStartingWith(char, allowHomophone)];
  },
  isHomophone(a: string, b: string): boolean {
    return isHomophone(a, b);
  },
};
