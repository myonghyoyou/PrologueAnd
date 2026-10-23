import type { Opt, CompareRowId } from '../../content/brief/rules';
export type { Locale } from '../../content/brief/copy/types';
export { UNKNOWN } from '../../content/brief/rules';

export type StepId =
  | 'mode' | 'renew' | 'kind' | 'goal' | 'audience' | 'pages' | 'features' | 'links'
  | 'content' | 'brand' | 'design' | 'ops' | 'own' | 'scope' | 'when';

export type Feature = Opt<'features'>; export type Goal = Opt<'goal'>;
export type Ref = { url: string; likes: Opt<'likes'>[]; memo: string };

/** 사장님 답(v2) — 선택지는 언어와 상관없는 id(content/brief/rules.ts)로 저장한다. 선택 안 함은 undefined 또는 빈 배열·빈 문자열, 모르겠어요는 'unknown'.
 *  langs 는 언어 코드(목록 밖 코드도 그대로 둔다). budget 은 한국어판 구간, budgetText 는 영어판 글칸 */
export type Answers = {
  v: 2; mode?: 'new' | 'renew';
  renewUrl: string; renewPain: string; renewAmount?: Opt<'renewAmount'>;
  kind?: Opt<'kind'>; kindOther: string; name: string;
  goalMain?: Goal; goalMore: Goal[]; audience: Opt<'audience'>[];
  pages: Opt<'pages'>[]; pagesExtra: string;
  features: Partial<Record<Feature, 'must' | 'later'>>; featuresExtra: string; featuresUnknown: boolean;
  booking?: Opt<'booking'>; shopCount?: Opt<'shopCount'>; shopHow?: Opt<'shopHow'>; member?: Opt<'member'>; langs: string[]; langOther: string;
  links: Opt<'links'>[]; copy?: Opt<'copy'>; photo?: Opt<'photo'>; contentBy: string; brand: Opt<'brand'>[];
  design?: Opt<'design'>; refs: Ref[]; dislikes: string; ops: Opt<'ops'>[];
  own: { domain: Opt<'ownDomain'>; hosting: Opt<'ownHosting'>; admin: Opt<'ownAdmin'>; source: Opt<'ownSource'> };
  revisions?: Opt<'revisions'>; care?: Opt<'care'>; monthlyCost: boolean;
  openDate: string; openUnknown: boolean; openFixed?: Opt<'openFixed'>;
  budget?: Opt<'budget'>; budgetText: string; budgetInBrief: boolean; decider?: Opt<'decider'>;
};
export type CompareV2 = { name: string; price: string; cells: Record<CompareRowId, string> }[];
