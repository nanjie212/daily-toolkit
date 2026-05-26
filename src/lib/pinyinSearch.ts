import { pinyin } from 'pinyin-pro';

export function matchPinyin(text: string, query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();

  if (text.toLowerCase().includes(lowerQuery)) return true;

  const pinyinFull = pinyin(text, { toneType: 'none', separator: '' }).toLowerCase();
  if (pinyinFull.includes(lowerQuery)) return true;

  const pinyinInitials = pinyin(text, { pattern: 'first', toneType: 'none', separator: '' }).toLowerCase();
  if (pinyinInitials.includes(lowerQuery)) return true;

  const pinyinWithSpace = pinyin(text, { toneType: 'none', separator: ' ' }).toLowerCase();
  const spacedQuery = lowerQuery.split('').join(' ');
  if (pinyinWithSpace.includes(spacedQuery)) return true;

  return false;
}

export function highlightPinyin(text: string): string {
  return text;
}