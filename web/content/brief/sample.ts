import { emptyAnswers } from '@/lib/brief/storage';
import type { Answers } from '@/lib/brief/types';
import type { BriefCopy } from './copy';

/** 시작 화면 견본 — 가상의 가게. 가게 이름만 화면 언어의 문구에서 */
export function sampleAnswers(c: BriefCopy): Answers {
  return {
    ...emptyAnswers(), mode: 'new', kind: 'shop', name: c.intro.sampleName, goalMain: 'visit', goalMore: ['book'],
    audience: ['new', 'regular'], pages: ['about', 'menu', 'location', 'news'],
    features: { booking: 'must', posts: 'later' }, booking: 'service',
  };
}
