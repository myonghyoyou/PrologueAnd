import { OPTS, YN_ROWS, OWN_DEFAULT, type OptKey, type CompareRowId } from '../../content/brief/rules';
import type { AnswersV2, CompareV2, FeatureId, GoalId } from './types';

/**
 * v1(한국어 글자로 저장한 답) → v2(id) 옮기기.
 * V1_MAP 은 2026-10-23 배포본의 글자 그대로 얼린 표다. 앞으로 content/brief/copy/ko.ts 를 고쳐도 이 표는 고치지 않는다
 * (이미 저장된 v1 답은 그 날의 글자로 남아 있으므로). ko.ts 에서 파생하지 말 것.
 */
export const V1_MAP = {
  renewAmount: { '적어요(10개 이하)': 'few', '보통': 'some', '많아요(100개 넘음)': 'many' },
  kind: { '가게(식당·카페 등)': 'shop', '예약 받는 곳(병원·학원·미용실 등)': 'appointment', '브랜드·제품': 'brand', '회사·사무실': 'office', '직접 입력': 'other' },
  goal: { '전화하기': 'call', '문의 남기기': 'inquire', '예약하기': 'book', '찾아오기': 'visit', '상품 사기': 'buy', '소식 보기': 'news' },
  audience: { '처음 오는 고객': 'new', '단골': 'regular', '거래처·기업': 'business', '외국인': 'foreign' },
  pages: { '소개': 'about', '메뉴·서비스': 'menu', '가격': 'pricing', '오시는 길': 'location', '소식': 'news', '사진·포트폴리오': 'gallery', '후기': 'reviews', '자주 묻는 질문': 'faq', '문의': 'contact', '채용': 'careers' },
  features: { '문의 남기기': 'inquiry', '예약 받기': 'booking', '상품 결제': 'payment', '회원': 'members', '외국어 페이지': 'multilang', '직접 글 올리기(공지·소식)': 'posts', '카카오 채널 연결': 'chat' },
  booking: { '네이버 예약 연결': 'service', '홈페이지 안에서 직접': 'builtin' },
  shopCount: { '10개 이하': 'upTo10', '50개 이하': 'upTo50', '그 이상': 'more' },
  shopHow: { '스마트스토어 연결로 충분': 'store', '홈페이지에서 직접 결제': 'builtin' },
  member: { '카카오로 로그인': 'social', '이메일로 가입': 'email', '관리자만': 'adminOnly' },
  langs: { '영어': 'en', '중국어': 'zh', '일본어': 'ja' },
  links: { '네이버 플레이스·예약': 'map', '카카오 채널': 'chat', '인스타그램': 'instagram', '스마트스토어': 'store', '배달앱': 'delivery', '없어요': 'none' },
  copy: { '직접 준비': 'self', '써 주길 원함': 'write' },
  photo: { '있어요': 'have', '없어요': 'none' },
  brand: { '로고 원본 파일': 'logo', '정해진 색·글꼴': 'colors', '명함·전단 같은 인쇄물': 'print', '없어요': 'none' },
  design: { '템플릿이어도 괜찮아요': 'template', '새 디자인을 맞춤으로 만들어 주세요': 'custom', '이미 정해진 디자인이 있어요': 'existing' },
  likes: { '색·분위기': 'color', '배치': 'layout', '글·사진': 'content', '움직임': 'motion', '기능': 'features' },
  ops: { '공지·소식': 'news', '사진': 'photos', '메뉴·가격': 'menu', '없어요(다 맡길게요)': 'none' },
  ownDomain: { '내 이름으로': 'mine', '업체에 맡김': 'vendor' },
  ownHosting: { '내 이름으로': 'mine', '업체에 맡김': 'vendor' },
  ownAdmin: { '대표 계정은 내가': 'mine', '업체에 맡김': 'vendor' },
  ownSource: { '오픈 때 받기': 'get', '안 받아도 됨': 'skip' },
  revisions: { '2번': '2', '3번(보통)': '3', '5번': '5', '업체 제안': 'vendor' },
  care: { '매달 맡기기': 'monthly', '필요할 때만': 'asNeeded', '직접 할게요': 'self' },
  openFixed: { '해당 날짜에 꼭 오픈해주세요': 'must', '희망일이에요': 'wish' },
  budget: { '100만 원 이하': 'lt100', '100~300만 원': '100to300', '300~800만 원': '300to800', '800만 원 이상': 'gt800' },
  decider: { '나 혼자': 'solo', '여럿이 같이': 'group' },
  compareRow: { '꼭 필요한 기능 포함': 'features', '도메인 내 이름': 'domain', '소스·파일 받음': 'source', '수정 횟수': 'revisions', '매달 비용': 'monthly', '오픈 가능일': 'openBy' },
  compareYn: { '예': 'yes', '아니오': 'no' },
} as const satisfies Record<string, Record<string, string>>;

const DUNNO_V1 = '모르겠어요';
const DEFAULT_VENDORS_V1 = ['A 업체', 'B 업체', 'C 업체'];

export function emptyAnswersV2(): AnswersV2 {
  return {
    v: 2, renewUrl: '', renewPain: '', kindOther: '', name: '', goalMore: [], audience: [], pages: [], pagesExtra: '',
    features: {}, featuresExtra: '', featuresUnknown: false, langs: [], langOther: '', links: [], contentBy: '', brand: [], refs: [], dislikes: '',
    ops: [], own: { ...OWN_DEFAULT }, monthlyCost: true, openDate: '', openUnknown: false, budgetText: '', budgetInBrief: false,
  };
}

type MapKey = keyof typeof V1_MAP;
const isStr = (x: unknown): x is string => typeof x === 'string';
/** 표에 없는 글자는 undefined. 「모르겠어요」는 그 질문에 unknown 이 있을 때만 unknown */
function one<T extends string>(map: MapKey, v: unknown, optKey?: OptKey): T | undefined {
  if (!isStr(v)) return undefined;
  const hit = (V1_MAP[map] as Record<string, string>)[v];
  if (hit) return hit as T;
  if (v === DUNNO_V1 && optKey && (OPTS[optKey] as readonly string[]).includes('unknown')) return 'unknown' as T;
  return undefined;
}
const many = <T extends string>(map: MapKey, v: unknown, optKey?: OptKey): T[] => (Array.isArray(v) ? v : []).map((x) => one<T>(map, x, optKey)).filter((x): x is T => x !== undefined);

/** 옛 저장본과 같은 모양 검사 — 배열이어야 할 칸이 배열인지 등. 틀리면 null */
function shapeOk(a: Record<string, unknown>): boolean {
  const empty = emptyAnswersV2() as Record<string, unknown>;
  for (const k of Object.keys(empty)) {
    if (k === 'v' || k === 'budgetText') continue;   // budgetText 는 v1 에 없던 칸
    const e = empty[k], g = a[k];
    if (Array.isArray(e) ? !Array.isArray(g) : typeof e !== typeof g || (typeof e === 'object' && g === null)) return false;
  }
  const own = a.own as Record<string, unknown>;
  return Object.values(own).every(isStr) && (a.refs as unknown[]).every((r) => !!r && typeof r === 'object' && isStr((r as { url: unknown }).url) && Array.isArray((r as { likes: unknown }).likes));
}

export function migrateV1(raw: unknown): AnswersV2 | null {
  if (!raw || typeof raw !== 'object' || (raw as { v?: unknown }).v !== 1) return null;
  const base = emptyAnswersV2();
  const r = raw as Record<string, unknown>;
  const m: Record<string, unknown> = { ...base, ...r, own: { ...base.own, ...(r.own && typeof r.own === 'object' ? (r.own as object) : {}) } };
  if (!shapeOk(m)) return null;
  const own = m.own as Record<string, unknown>;
  // own 은 기본값이 미리 골라져 있으므로, 표에 없는 글자는 그 줄의 기본값. 「모르겠어요」만 unknown
  const ownOne = <K extends keyof AnswersV2['own']>(k: K, map: MapKey, optKey: OptKey): AnswersV2['own'][K] => (one(map, own[k], optKey) ?? OWN_DEFAULT[k]) as AnswersV2['own'][K];
  const features: AnswersV2['features'] = {};
  for (const [k, val] of Object.entries(m.features as Record<string, unknown>)) {
    const id = one<FeatureId>('features', k);
    if (id && (val === 'must' || val === 'later')) features[id] = val;
  }
  return {
    ...base, v: 2,
    mode: m.mode === 'new' || m.mode === 'renew' ? m.mode : undefined,
    renewUrl: m.renewUrl as string, renewPain: m.renewPain as string, renewAmount: one('renewAmount', m.renewAmount, 'renewAmount'),
    kind: one('kind', m.kind, 'kind'), kindOther: m.kindOther as string, name: m.name as string,
    goalMain: one<GoalId>('goal', m.goalMain, 'goal'), goalMore: many<GoalId>('goal', m.goalMore, 'goal'),
    audience: many('audience', m.audience, 'audience'),
    pages: many('pages', m.pages, 'pages'), pagesExtra: m.pagesExtra as string,
    features, featuresExtra: m.featuresExtra as string, featuresUnknown: m.featuresUnknown as boolean,
    booking: one('booking', m.booking, 'booking'), shopCount: one('shopCount', m.shopCount, 'shopCount'), shopHow: one('shopHow', m.shopHow, 'shopHow'),
    member: one('member', m.member, 'member'), langs: many('langs', m.langs), langOther: m.langOther as string,
    links: many('links', m.links, 'links'), copy: one('copy', m.copy, 'copy'), photo: one('photo', m.photo, 'photo'), contentBy: m.contentBy as string,
    brand: many('brand', m.brand, 'brand'), design: one('design', m.design, 'design'),
    refs: (m.refs as { url: string; likes: unknown; memo?: unknown }[]).map((x) => ({ url: x.url, likes: many('likes', x.likes), memo: isStr(x.memo) ? x.memo : '' })),
    dislikes: m.dislikes as string, ops: many('ops', m.ops, 'ops'),
    own: { domain: ownOne('domain', 'ownDomain', 'ownDomain'), hosting: ownOne('hosting', 'ownHosting', 'ownHosting'), admin: ownOne('admin', 'ownAdmin', 'ownAdmin'), source: ownOne('source', 'ownSource', 'ownSource') },
    revisions: one('revisions', m.revisions, 'revisions'), care: one('care', m.care, 'care'), monthlyCost: m.monthlyCost as boolean,
    openDate: m.openDate as string, openUnknown: m.openUnknown as boolean, openFixed: one('openFixed', m.openFixed, 'openFixed'),
    budget: one('budget', m.budget, 'budget'), budgetText: '', budgetInBrief: m.budgetInBrief as boolean, decider: one('decider', m.decider, 'decider'),
  };
}

export function migrateCompareV1(raw: unknown): CompareV2 | null {
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const out: CompareV2 = [];
  for (const v of raw) {
    if (!v || typeof v !== 'object' || !isStr(v.name) || !isStr(v.price) || !v.cells || typeof v.cells !== 'object') return null;
    const cells = {} as Record<CompareRowId, string>;
    for (const [label, id] of Object.entries(V1_MAP.compareRow) as [string, CompareRowId][]) {
      const c = (v.cells as Record<string, unknown>)[label];
      const s = isStr(c) ? c : '';
      cells[id] = YN_ROWS.includes(id) ? ((V1_MAP.compareYn as Record<string, string>)[s] ?? '') : s;
    }
    out.push({ name: DEFAULT_VENDORS_V1.includes(v.name) ? '' : v.name, price: v.price, cells });
  }
  return out;
}
