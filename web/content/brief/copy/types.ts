import type { CompareRowId, Opt, OptKey } from '../rules';

export type Locale = 'ko' | 'en';
/** 선택지 id → 글자 */
export type L<K extends OptKey> = Record<Opt<K>, string>;

export type SectionId = 'purpose' | 'renew' | 'pages' | 'features' | 'links' | 'content' | 'brand' | 'design' | 'ops' | 'own' | 'scope' | 'when' | 'budget' | 'unknown';
/** 「업체 제안을 받고 싶은 것」에 오르는 17개 항목 */
export type UnknownKey = 'renewAmount' | 'audience' | 'pages' | 'features' | 'links' | 'copy' | 'photo' | 'brand' | 'design' | 'ops'
  | 'domain' | 'hosting' | 'admin' | 'source' | 'revisions' | 'care' | 'openDate';

/** 요청서 줄 이름 */
export type DocRows = {
  kind: string; goalMain: string; goalMore: string; audience: string;
  renewUrl: string; renewPain: string; renewAmount: string;
  pages: (n: number) => string; featuresExtra: string; links: string;
  copy: string; photo: string; contentBy: string; brand: string;
  design: string; ref: (n: number) => string; refLikes: (n: number) => string; refMemo: (n: number) => string; dislikes: string;
  opsWhat: string; opsAdmin: string;
  own: Record<'domain' | 'hosting' | 'admin' | 'source', string>;
  revisions: string; care: string; openDate: string; decider: string; budget: string;
};
/** 요청서 줄 값 — 업체에게 보내는 문서 말투(명사형)로 바꾼 것 */
export type DocValues = {
  goal: L<'goal'>; amount: Partial<L<'renewAmount'>>; copy: Partial<L<'copy'>>; photo: Partial<L<'photo'>>; design: Partial<L<'design'>>;
  own: { domain: Partial<L<'ownDomain'>>; hosting: Partial<L<'ownHosting'>>; admin: Partial<L<'ownAdmin'>>; source: Partial<L<'ownSource'>> };
  care: L<'care'>; decider: L<'decider'>; brandNone: string; revisions: Partial<L<'revisions'>>;
  shopCount: Partial<L<'shopCount'>>;   // 기능 줄의 「상품 n」 머리
  none: string; needed: string; noneAll: string; openMust: string; openWish: string;
};

export type BriefCopy = {
  locale: Locale;
  q: {
    mode: { title: string; opts: L<'mode'> };
    renew: { title: string; url: string; pain: string; amountLabel: string; amount: L<'renewAmount'>; amountWhy: string };
    kind: { title: string; help: string; opts: L<'kind'>; otherLabel: string; name: string; nameHelp: string };
    goal: { title: string; help: string; opts: L<'goal'>; more: string };
    audience: { title: string; help: string; opts: L<'audience'> };
    pages: { title: string; help: string; opts: L<'pages'>; extra: string; manyWhy: string };
    features: { title: string; help: string; opts: L<'features'>; must: string; later: string; unknown: string; extra: string; extraHelp: string;
      why: Partial<L<'features'>>; foreignSuggest: string;
      booking: { label: string; opts: L<'booking'> }; shopCount: { label: string; opts: L<'shopCount'> };
      shopHow: { label: string; opts: L<'shopHow'> }; member: { label: string; opts: L<'member'> };
      langs: { label: string; other: string } };
    links: { title: string; opts: L<'links'>; manyWhy: string };
    content: { title: string; copyLabel: string; copy: L<'copy'>; photoLabel: string; photo: L<'photo'>; by: string; why: string };
    brand: { title: string; opts: L<'brand'>; noneWhy: string };
    design: { title: string; opts: L<'design'>; customWhy: string; refsLabel: string; refUrl: (n: number) => string; likesLabel: string; likes: L<'likes'>; memo: string; dislikes: string };
    ops: { title: string; help: string; opts: L<'ops'> };
    own: { title: string; help: string;
      domain: { label: string; why: string; opts: L<'ownDomain'> }; hosting: { label: string; why: string; opts: L<'ownHosting'> };
      admin: { label: string; why: string; opts: L<'ownAdmin'> }; source: { label: string; why: string; opts: L<'ownSource'> } };
    scope: { title: string; revisionsLabel: string; revisions: L<'revisions'>; careLabel: string; care: L<'care'>; monthly: string };
    when: { title: string; date: string; dateUnknown: string; fixedLabel: string; fixed: L<'openFixed'>;
      budget: { kind: 'range'; label: string; opts: L<'budget'> } | { kind: 'text'; label: string; hint: string };
      budgetIn: string; budgetHelp: string; deciderLabel: string; decider: L<'decider'>; rushWhy: string };
  };
  ui: { impactBadge: string; dunno: string; required: string; multiHint: string; prev: string; next: string; stepNext: string; toResult: string; makeBrief: string;
    preview: string; phases: readonly [string, string, string, string]; phaseOf: (n: number, total: number) => string; noStore: string;
    previewEmpty: string; langName: (code: string) => string };
  intro: { title: string; lead: string; promises: readonly [string, string, string]; neutral: string; start: string; sampleCaption: string; stamp: string; rest: string;
    sampleName: string; switchTo: { href: string; label: string; lang: Locale } };
  doc: { title: (name: string) => string; untitled: string; subtitle: (mode: 'new' | 'renew', today: Date) => string;
    sections: Record<SectionId, string>; rows: DocRows; values: DocValues; tags: { must: string; later: string };
    unknown: Record<UnknownKey, string>; vendorLead: string; qPrefix: (n: number) => string; formatDay: (iso: string) => string };
  impact: { renewMany: string; pages: (n: number) => string; feature: (name: string, must: boolean) => string; multilang: (n: number) => string;
    links: (n: number) => string; copyWrite: string; noLogo: string; custom: string; rush: string; bookingService: string };
  vendor: { revisions: string; monthly: string; contact: string; admin: string; bookingService: string; bookingOther: string; payment: string;
    translate: string; existingDesign: string; copyCost: string; migrate: string; deadline: string };
  summary: { mode: { new: string; renew: string }; kind: string; name: string; goal: string; must: string; extra: string; pages: (n: number) => string; open: string; written: string };
  result: { impactTitle: string; impactLegend: string; impactNone: string; edit: string; editAria: (label: string) => string; vendorTitle: string; vendorPrintLead: string;
    compareTitle: string; comparePrice: string; compareRows: Record<CompareRowId, string>; vendorName: (i: number) => string; nameAria: (i: number) => string;
    cellAria: (vendor: string, row: string, value: string) => string;
    yn: { yes: string; no: string; unset: string; unsetAria: string };
    compareNote: string;
    pdf: string; copy: string; share: string; editAll: string; reset: string; resetConfirm: string; copied: string; inAppHint: string; printFailed: string;
    copyBoxHelp: string; privacy: string };
  end: { kind: 'drawer'; text: string; send: string; toOwnership: string }
     | { kind: 'mail'; madeBy: string; send: string; hint: string; attachLine: string; toOwnership: string };
  print: { lineChars: number };
};
