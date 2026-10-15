export const UNKNOWN = '모르겠어요';

export type StepId =
  | 'mode' | 'renew' | 'kind' | 'goal' | 'audience' | 'pages' | 'features' | 'links'
  | 'content' | 'brand' | 'design' | 'ops' | 'own' | 'scope' | 'when';

export type Feature = '문의 남기기' | '예약 받기' | '상품 결제' | '회원' | '외국어 페이지' | '직접 글 올리기(공지·소식)' | '카카오 채널 연결';
export type Goal = '전화하기' | '문의 남기기' | '예약하기' | '찾아오기' | '상품 사기' | '소식 보기';
export type Ref = { url: string; likes: string[]; memo: string };

/** 사장님 답. 선택 안 함은 undefined 또는 빈 배열·빈 문자열. 「모르겠어요」는 UNKNOWN 문자열 */
export type Answers = {
  v: 1;
  mode?: 'new' | 'renew';
  renewUrl: string; renewPain: string; renewAmount?: string;
  kind?: string; kindOther: string; name: string;
  goalMain?: Goal; goalMore: Goal[];
  audience: string[];
  pages: string[]; pagesExtra: string;
  features: Partial<Record<Feature, 'must' | 'later'>>; featuresUnknown: boolean;
  booking?: string; shopCount?: string; shopHow?: string; member?: string; langs: string[]; langOther: string;
  links: string[];
  copy?: string; photo?: string; contentBy: string;
  brand: string[];
  design?: string; refs: Ref[]; dislikes: string;
  ops: string[];
  own: { domain: string; hosting: string; admin: string; source: string };
  revisions?: string; care?: string; monthlyCost: boolean;
  openDate: string; openUnknown: boolean; openFixed?: string;
  budget?: string; budgetInBrief: boolean;
  decider?: string;
};
