import { ko } from './ko';
import { en } from './en';
import type { BriefCopy, Locale } from './types';

export function copyFor(locale: Locale): BriefCopy {
  return locale === 'en' ? en : ko;
}
export type { BriefCopy, Locale } from './types';
