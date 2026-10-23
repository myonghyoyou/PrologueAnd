import type { Locale } from '@/lib/ownership/types';
import type { OwnershipCopy } from './types';
import { ko } from './ko';
import { en } from './en';

export { ko, en };
export type { OwnershipCopy };
export const copyFor = (locale: Locale): OwnershipCopy => (locale === 'en' ? en : ko);
