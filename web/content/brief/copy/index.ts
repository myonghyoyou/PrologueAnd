import { ko } from './ko';
import type { BriefCopy, Locale } from './types';

/** 영어 문구(en)는 Task 3에서 더한다 — 그때까지 en 도 ko 로 돌린다 */
export function copyFor(locale: Locale): BriefCopy {
  return locale === 'en' ? ko : ko;
}
export type { BriefCopy, Locale } from './types';
