import type { Answers } from './types';

export function emptyAnswers(): Answers {
  return {
    v: 1, renewUrl: '', renewPain: '', kindOther: '', name: '', goalMore: [], audience: [], pages: [], pagesExtra: '',
    features: {}, featuresUnknown: false, langs: [], langOther: '', links: [], contentBy: '', brand: [], refs: [], dislikes: '',
    ops: [], own: { domain: '내 이름으로', hosting: '내 이름으로', admin: '대표 계정은 내가', source: '오픈 때 받기' },
    monthlyCost: true, openDate: '', openUnknown: false, budgetInBrief: false,
  };
}
