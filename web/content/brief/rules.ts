/** 언어와 상관없는 선택지 id 규칙 — 답은 이 id 로 저장하고, 글자는 copy/<언어>.ts 가 맡는다. 배열 순서 = 화면에 보이는 순서 */
export const OPTS = {
  mode: ['new', 'renew'],
  renewAmount: ['few', 'some', 'many', 'unknown'],
  kind: ['shop', 'appointment', 'brand', 'office', 'other'],
  goal: ['call', 'inquire', 'book', 'visit', 'buy', 'news'],
  audience: ['new', 'regular', 'business', 'foreign', 'unknown'],
  pages: ['about', 'menu', 'pricing', 'location', 'news', 'gallery', 'reviews', 'faq', 'contact', 'careers'],
  features: ['inquiry', 'booking', 'payment', 'members', 'multilang', 'posts', 'chat'],
  booking: ['service', 'builtin', 'unknown'],
  shopCount: ['upTo10', 'upTo50', 'more', 'unknown'],
  shopHow: ['store', 'builtin', 'unknown'],
  member: ['social', 'email', 'adminOnly', 'unknown'],
  links: ['map', 'chat', 'instagram', 'store', 'delivery', 'none'],
  copy: ['self', 'write', 'unknown'],
  photo: ['have', 'none', 'unknown'],
  brand: ['logo', 'colors', 'print', 'none'],
  design: ['template', 'custom', 'existing', 'unknown'],
  likes: ['color', 'layout', 'content', 'motion', 'features'],
  ops: ['news', 'photos', 'menu', 'none'],
  ownDomain: ['mine', 'vendor', 'unknown'], ownHosting: ['mine', 'vendor', 'unknown'],
  ownAdmin: ['mine', 'vendor', 'unknown'], ownSource: ['get', 'skip', 'unknown'],
  revisions: ['2', '3', '5', 'vendor'],
  care: ['monthly', 'asNeeded', 'self'],
  openFixed: ['must', 'wish'],
  budget: ['lt100', '100to300', '300to800', 'gt800', 'unknown'],
  decider: ['solo', 'group'],
} as const;
export type OptKey = keyof typeof OPTS;
export type Opt<K extends OptKey> = (typeof OPTS)[K][number];
export const UNKNOWN = 'unknown';
export const NONE = 'none';
/** 외국어 단추(언어 코드) — 화면 언어마다 다르다 */
export const LANG_OPTS = { ko: ['en', 'zh', 'ja'], en: ['es', 'fr', 'zh'] } as const;
export const COMPARE_ROWS = ['features', 'domain', 'source', 'revisions', 'monthly', 'openBy'] as const;
export type CompareRowId = (typeof COMPARE_ROWS)[number];
/** 비교표에서 예·아니오로 답하는 줄 */
export const YN_ROWS: CompareRowId[] = ['features', 'domain', 'source'];
/** 눌러서 돌아가는 순서: 빈칸 → 예 → 아니오 → 빈칸 */
export const YN = ['', 'yes', 'no'] as const;
/** 견적가 영향 기준값 — 지금 derive.ts·steps.tsx 의 숫자 그대로 */
export const PAGES_MANY = 10, LINKS_MANY = 3, RUSH_DAYS = 30;
export const OWN_DEFAULT = { domain: 'mine', hosting: 'mine', admin: 'mine', source: 'get' } as const;
