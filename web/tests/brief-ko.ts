import { expect, type Page } from '@playwright/test';
import { migrateV1, V1_MAP } from '../lib/brief/migrate-v1';
import { OPTS, type OptKey } from '../content/brief/rules';
import type { Answers, StepId } from '../lib/brief/types';

/** 테스트 답은 읽기 쉽게 한국어 글자로 적고, v1 옮기기(migrateV1)로 id 답을 만든다 — 저장되는 값은 id 다 */

/** 언어 분리 전 emptyAnswers() 의 값을 글자 그대로 옮긴 v1 빈 답 */
export const EMPTY_V1 = {
  v: 1, renewUrl: '', renewPain: '', kindOther: '', name: '', goalMore: [], audience: [], pages: [], pagesExtra: '',
  features: {}, featuresExtra: '', featuresUnknown: false, langs: [], langOther: '', links: [], contentBy: '', brand: [], refs: [], dislikes: '',
  ops: [], own: { domain: '내 이름으로', hosting: '내 이름으로', admin: '대표 계정은 내가', source: '오픈 때 받기' },
  monthlyCost: true, openDate: '', openUnknown: false, budgetInBrief: false,
};

type MapKey = keyof typeof V1_MAP;
/** 그 글자가 대응표에 있는지 — 「모르겠어요」는 그 질문에 unknown 이 있을 때만 */
const known = (map: MapKey, x: unknown, opt?: OptKey) =>
  typeof x === 'string' && (x in V1_MAP[map] || (x === '모르겠어요' && !!opt && (OPTS[opt] as readonly string[]).includes('unknown')));

const ONE: [keyof Answers, MapKey, OptKey][] = [['renewAmount', 'renewAmount', 'renewAmount'], ['kind', 'kind', 'kind'], ['goalMain', 'goal', 'goal'],
  ['booking', 'booking', 'booking'], ['shopCount', 'shopCount', 'shopCount'], ['shopHow', 'shopHow', 'shopHow'], ['member', 'member', 'member'],
  ['copy', 'copy', 'copy'], ['photo', 'photo', 'photo'], ['design', 'design', 'design'], ['revisions', 'revisions', 'revisions'], ['care', 'care', 'care'],
  ['openFixed', 'openFixed', 'openFixed'], ['budget', 'budget', 'budget'], ['decider', 'decider', 'decider']];
const MANY: [string, MapKey, OptKey?][] = [['goalMore', 'goal', 'goal'], ['audience', 'audience', 'audience'], ['pages', 'pages', 'pages'], ['langs', 'langs'],
  ['links', 'links', 'links'], ['brand', 'brand', 'brand'], ['ops', 'ops', 'ops']];
const OWN: [string, MapKey, OptKey][] = [['domain', 'ownDomain', 'ownDomain'], ['hosting', 'ownHosting', 'ownHosting'], ['admin', 'ownAdmin', 'ownAdmin'], ['source', 'ownSource', 'ownSource']];

/** 한국어(v1) 답 → id 답. 실제 migrateV1 은 대응표에 없는 글자를 조용히 버리지만, 테스트 답의 오타가 빈 칸으로 통과하지 않게 여기서는 멈춘다 */
export function fromKo(v1Partial: Record<string, unknown>): Answers {
  const m = { ...EMPTY_V1, ...v1Partial, v: 1 } as Record<string, unknown>;
  const bad: string[] = [];
  if (m.mode !== undefined && m.mode !== 'new' && m.mode !== 'renew') bad.push(`mode: ${String(m.mode)}`);
  for (const [k, map, opt] of ONE) if (m[k] !== undefined && m[k] !== '' && !known(map, m[k], opt)) bad.push(`${k}: ${String(m[k])}`);
  for (const [k, map, opt] of MANY) for (const x of (m[k] as unknown[]) ?? []) if (!known(map, x, opt)) bad.push(`${k}: ${String(x)}`);
  for (const f of Object.keys((m.features as object) ?? {})) if (!known('features', f)) bad.push(`features: ${f}`);
  for (const r of (m.refs as { likes?: unknown[] }[]) ?? []) for (const x of r.likes ?? []) if (!known('likes', x)) bad.push(`likes: ${String(x)}`);
  const own = (m.own ?? {}) as Record<string, unknown>;
  for (const [k, map, opt] of OWN) if (own[k] !== undefined && !known(map, own[k], opt)) bad.push(`own.${k}: ${String(own[k])}`);
  if (bad.length) throw new Error(`fromKo: 대응표에 없는 글자 — ${bad.join(' / ')}`);
  const a = migrateV1(m);
  if (!a) throw new Error(`fromKo: 옮기지 못함 — ${JSON.stringify(v1Partial)}`);
  return a;
}

/** 그 주소를 열고 v2 키에 답을 써 둔 뒤 새로 불러온다 */
export async function seedBrief(page: Page, answers: Answers, step: StepId, done = false, path = '/tools/brief') {
  await page.goto(path);
  await expect(page.locator('[data-brief] h1')).toBeVisible();
  await page.evaluate(([an, st, dn]) => localStorage.setItem('prologue.brief.v2', JSON.stringify({ answers: an, step: st, done: dn })), [answers, step, done] as const);
  await page.reload();
}

/** 문서에 크기가 A4인 @page 규칙이 있는가 — @media 안까지 훑는다 */
export const hasA4 = (page: Page) => page.evaluate(() => {
  // size 값을 못 읽는 브라우저도 있어 규칙 글자(cssText)에서도 찾는다
  const isA4 = (r: CSSPageRule) => /A4/i.test(r.style.getPropertyValue('size')) || /size\s*:\s*A4/i.test(r.cssText);
  const walk = (rules: CSSRuleList): boolean => [...rules].some((r) =>
    r instanceof CSSPageRule ? isA4(r) : 'cssRules' in r ? walk((r as CSSGroupingRule).cssRules) : false);
  return [...document.styleSheets].some((sh) => { try { return walk(sh.cssRules); } catch { return false; } });
});

/** 인쇄 한 쪽 테스트의 답 세트(v1 글자) — brief-print.spec.ts(한국어 A4)와 brief-en.spec.ts(영어 A4·Letter)가 같이 쓴다 */
export const RICH = { v: 1, mode: 'renew', renewUrl: 'example.com', renewPain: '모바일에서 글자가 너무 작고 예약 버튼을 찾기 어려워요', renewAmount: '보통',
  kind: '가게(식당·카페 등)', name: '봄날 베이커리', goalMain: '찾아오기', goalMore: ['예약하기', '소식 보기'], audience: ['처음 오는 고객', '단골'],
  pages: ['소개', '메뉴·서비스', '가격', '오시는 길', '소식'], pagesExtra: '단체 주문', features: { '문의 남기기': 'must', '예약 받기': 'must', '외국어 페이지': 'later' },
  featuresExtra: '쿠폰 발급', booking: '네이버 예약 연결', langs: ['영어'], links: ['네이버 플레이스·예약', '인스타그램'], copy: '써 주길 원함', photo: '없어요',
  brand: ['로고 원본 파일'], design: '새 디자인을 맞춤으로 만들어 주세요', refs: [{ url: 'https://example.org', likes: ['색·분위기', '배치'], memo: '사진이 크게 나오는 게 좋아요' }],
  dislikes: '너무 화려한 움직임', ops: ['공지·소식', '메뉴·가격'], revisions: '3번(보통)', care: '필요할 때만', openDate: '2026-11-10', openFixed: '해당 날짜에 꼭 오픈해주세요',
  budget: '300~800만 원', budgetInBrief: true, decider: '나 혼자' };
export const MIN = { v: 1, mode: 'new', kind: '회사·사무실', goalMain: '문의 남기기' };
const L = (n: number) => '모바일에서 글자가 작고 예약 단추를 찾기 어려워요. '.repeat(n).slice(0, 300);
/** 거의 모든 칸을 채우고 긴 글(300자)까지 넣은 경우 */
export const MAX = { ...RICH, renewPain: L(10), renewAmount: '많아요(100개 넘음)', goalMore: ['전화하기', '문의 남기기', '상품 사기', '소식 보기'], audience: ['처음 오는 고객', '단골', '거래처·기업', '외국인'],
  pages: ['소개', '메뉴·서비스', '가격', '오시는 길', '소식', '사진·포트폴리오', '후기', '자주 묻는 질문', '문의', '채용'], pagesExtra: '단체 주문, 이벤트, 제휴',
  features: { '문의 남기기': 'must', '예약 받기': 'must', '상품 결제': 'must', '회원': 'later', '외국어 페이지': 'later', '직접 글 올리기(공지·소식)': 'must', '카카오 채널 연결': 'must' },
  featuresExtra: '쿠폰 발급, 대기 번호 안내, 포인트 적립', booking: '홈페이지 안에서 직접', shopCount: '50개 이하', shopHow: '홈페이지에서 직접 결제', member: '카카오로 로그인', langs: ['영어', '중국어', '일본어'],
  links: ['네이버 플레이스·예약', '카카오 채널', '인스타그램', '스마트스토어', '배달앱'], contentBy: '2026-11-01', brand: ['로고 원본 파일', '정해진 색·글꼴', '명함·전단 같은 인쇄물'],
  refs: [1, 2, 3].map((i) => ({ url: `https://example${i}.org/some/page`, likes: ['색·분위기', '배치', '글·사진'], memo: '사진이 크게 나오고 글이 짧은 점이 좋아요' })),
  dislikes: L(10), ops: ['공지·소식', '사진', '메뉴·가격'], revisions: '5번', care: '매달 맡기기', budget: '800만 원 이상', decider: '여럿이 같이' };
/** 그 사이 — 긴 글 없이 칸만 많이 채운 경우 */
export const MID = { ...MAX, renewPain: '모바일에서 글자가 작아요', dislikes: '화려한 움직임', refs: MAX.refs.slice(0, 2) };


const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
/** 세트에 쓴 자유 입력 글의 영어 — 영어 사장님이 적을 만한 글로(글자 수를 맞추지 않는다. 영어가 더 길다) */
const EN_OF: Record<string, string> = {
  '모바일에서 글자가 너무 작고 예약 버튼을 찾기 어려워요': 'Text is too small on phones and the booking button is hard to find',
  '모바일에서 글자가 작아요': 'Text is small on phones',
  '사진이 크게 나오는 게 좋아요': 'I like that the photos are large',
  '사진이 크게 나오고 글이 짧은 점이 좋아요': 'I like that the photos are large and the text is short',
  '너무 화려한 움직임': 'Too much flashy motion', '화려한 움직임': 'Flashy motion',
  '단체 주문': 'Group orders', '단체 주문, 이벤트, 제휴': 'Group orders, Events, Partnerships',
  '쿠폰 발급': 'Gift cards', '쿠폰 발급, 대기 번호 안내, 포인트 적립': 'Gift cards, Waitlist, Loyalty points',
};
const EN_LINE = 'Text is small on phones and the booking button is hard to find. ';
/** 표에 없는 한글 글(L(n) 같은 긴 글)은 같은 길이의 영어 글로 */
const enText = (s: string) => (!HANGUL.test(s) ? s : EN_OF[s] ?? EN_LINE.repeat(Math.ceil(s.length / EN_LINE.length) + 1).slice(0, s.length).trim());

/** 영어판 답 세트 — fromKo 로 만든 답에서 사장님이 직접 적는 칸만 영어 글로 바꾼다. 선택지 id 는 그대로(명세 9-6: 한글 없음 검사가 사용자 입력 때문에 걸리지 않게).
 *  한국어판 예산 구간을 요청서에 넣기로 한 세트는 영어 예산 글칸도 채워 같은 줄이 생기게 한다 */
export function toEnglishText(a: Answers): Answers {
  return { ...a, renewPain: enText(a.renewPain), kindOther: enText(a.kindOther), name: HANGUL.test(a.name) ? 'Sample Bakery' : a.name,
    pagesExtra: enText(a.pagesExtra), featuresExtra: enText(a.featuresExtra), langOther: enText(a.langOther), dislikes: enText(a.dislikes),
    refs: a.refs.map((r) => ({ ...r, memo: enText(r.memo) })), budgetText: a.budgetText || (a.budgetInBrief && a.budget ? '$3,000–$8,000' : '') };
}
