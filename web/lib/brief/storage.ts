import { OPTS, OWN_DEFAULT, COMPARE_ROWS, YN_ROWS, YN, type OptKey, type CompareRowId } from '../../content/brief/rules';
import type { Answers, CompareV2, StepId } from './types';
import { ALL } from './steps';
import { migrateV1, migrateCompareV1 } from './migrate-v1';

export function emptyAnswers(): Answers {
  return {
    v: 2, renewUrl: '', renewPain: '', kindOther: '', name: '', goalMore: [], audience: [], pages: [], pagesExtra: '',
    features: {}, featuresExtra: '', featuresUnknown: false, langs: [], langOther: '', links: [], contentBy: '', brand: [], refs: [], dislikes: '',
    ops: [], own: { ...OWN_DEFAULT }, monthlyCost: true, openDate: '', openUnknown: false, budgetText: '', budgetInBrief: false,
  };
}

// 두 언어가 같은 키를 쓴다 — 언어를 바꿔도 답이 이어진다. v1 키는 옮긴 뒤 지운다(명세 4절)
export const KEY = 'prologue.brief.v2';
export const KEY_CMP = 'prologue.brief.compare.v2';
export const KEY_V1 = 'prologue.brief.v1';
export const KEY_CMP_V1 = 'prologue.brief.compare.v1';
export type Saved = { answers: Answers; step: StepId; done: boolean };

/** 브라우저 저장소. 시크릿 창·차단이면 null 또는 접근 때 예외 — 모든 접근을 감싼다 */
export function browserStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export function storageOk(s: Storage | null): boolean {
  if (!s) return false;
  try { s.setItem('prologue.brief.probe', '1'); s.removeItem('prologue.brief.probe'); return true; } catch { return false; }
}

/** 같은 v2 안에서도 손으로 고쳤거나 형식이 어긋난 값은 버린다 — 그대로 그리면 화면 전체가 오류로 멈춘다 */
function shapeOk(a: Answers): boolean {
  const empty = emptyAnswers() as Record<string, unknown>;
  const got = a as Record<string, unknown>;
  for (const k of Object.keys(empty)) {
    const e = empty[k], g = got[k];
    if (Array.isArray(e) ? !Array.isArray(g) : typeof e !== typeof g || (typeof e === 'object' && g === null)) return false;
  }
  return Object.values(a.own).every((x) => typeof x === 'string') && a.refs.every((r) => r && typeof r.url === 'string' && Array.isArray(r.likes));
}

/** id 검사 — 선택지 칸의 값이 OPTS 에 없으면 그 칸만 비운다(전체를 버리지 않는다). 여러 개 칸은 모르는 id 만 뺀다. langs 는 목록 밖 코드도 답이라 보지 않는다 */
const ok = <K extends OptKey>(k: K, v: unknown) => (OPTS[k] as readonly unknown[]).includes(v);
const one = <K extends OptKey>(k: K, v: unknown) => (ok(k, v) ? v : undefined) as (typeof OPTS)[K][number] | undefined;
const many = <K extends OptKey>(k: K, v: unknown[]) => v.filter((x) => ok(k, x)) as (typeof OPTS)[K][number][];
function idsOk(a: Answers): Answers {
  const features: Answers['features'] = {};
  for (const [f, t] of Object.entries(a.features)) if (ok('features', f) && (t === 'must' || t === 'later')) features[f as keyof Answers['features']] = t;
  // 명의는 늘 하나가 골라져 있는 칸이라 모르는 id 는 비우지 않고 기본값으로
  const own = (k: keyof Answers['own'], o: 'ownDomain' | 'ownHosting' | 'ownAdmin' | 'ownSource') => (ok(o, a.own[k]) ? a.own[k] : OWN_DEFAULT[k]);
  return {
    ...a, langs: a.langs.filter((x) => typeof x === 'string' && /^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/.test(x)),   // 어긋난 언어 코드는 Intl.DisplayNames 를 멈추게 한다
    mode: a.mode === 'new' || a.mode === 'renew' ? a.mode : undefined,
    renewAmount: one('renewAmount', a.renewAmount), kind: one('kind', a.kind), goalMain: one('goal', a.goalMain), goalMore: many('goal', a.goalMore),
    audience: many('audience', a.audience), pages: many('pages', a.pages), features,
    booking: one('booking', a.booking), shopCount: one('shopCount', a.shopCount), shopHow: one('shopHow', a.shopHow), member: one('member', a.member),
    links: many('links', a.links), copy: one('copy', a.copy), photo: one('photo', a.photo), brand: many('brand', a.brand), design: one('design', a.design),
    refs: a.refs.map((r) => ({ url: r.url, likes: many('likes', r.likes), memo: typeof r.memo === 'string' ? r.memo : '' })), ops: many('ops', a.ops),
    own: { domain: own('domain', 'ownDomain') as Answers['own']['domain'], hosting: own('hosting', 'ownHosting') as Answers['own']['hosting'],
      admin: own('admin', 'ownAdmin') as Answers['own']['admin'], source: own('source', 'ownSource') as Answers['own']['source'] },
    revisions: one('revisions', a.revisions), care: one('care', a.care), openFixed: one('openFixed', a.openFixed), budget: one('budget', a.budget), decider: one('decider', a.decider),
  };
}

function readV2(raw: string): Saved | null {
  const v = JSON.parse(raw) as Saved;
  if (!v || v.answers?.v !== 2 || !ALL.includes(v.step)) return null;
  const answers = { ...emptyAnswers(), ...v.answers, own: { ...emptyAnswers().own, ...v.answers.own } };
  if (!shapeOk(answers)) return null;
  return { answers: idsOk(answers), step: v.step, done: !!v.done };
}

/** ① v2 키 ② v2 가 없으면 v1 을 옮겨 v2 에 쓴다. v1 키는 옮기기가 되든 안 되든(예외가 나도) 지운다 — 다음에 열 때 같은 실패를 되풀이하지 않게 */
export function loadSaved(s: Storage | null): Saved | null {
  try {
    if (!s) return null;
    const raw = s.getItem(KEY);
    if (raw) return readV2(raw);
    const old = s.getItem(KEY_V1); if (old === null) return null;
    let out: Saved | null = null;
    try {
      const v = JSON.parse(old) as { answers?: unknown; step?: StepId; done?: unknown };
      const answers = v && v.step && ALL.includes(v.step) ? migrateV1(v.answers) : null;
      if (answers) out = { answers, step: v.step!, done: !!v.done };
    } catch { out = null; }
    if (out) saveSaved(s, out);
    try { s.removeItem(KEY_V1); } catch { /* 지울 수 없으면 다음에 다시 버린다 */ }
    return out;
  } catch { return null; }
}

export function saveSaved(s: Storage | null, v: Saved): boolean {
  try { if (!s) return false; s.setItem(KEY, JSON.stringify(v)); return true; } catch { return false; }
}

/** v1·v2 네 키를 모두 — 옮기기가 덜 끝난 브라우저에서 지운 뒤 다시 열어도 옛 답이 되살아나지 않게 */
export function clearBrief(s: Storage | null): void {
  try { for (const k of [KEY, KEY_CMP, KEY_V1, KEY_CMP_V1]) s?.removeItem(k); } catch { /* 저장이 막혀 있으면 지울 것도 없다 */ }
}

export type Vendor = CompareV2[number];

/** 업체 이름은 빈 값으로 둔다 — 빈 칸에는 화면 언어의 「A 업체」가 자리 글자로 보인다 */
export function emptyCompare(): Vendor[] {
  const cells = Object.fromEntries(COMPARE_ROWS.map((r) => [r, ''])) as Record<CompareRowId, string>;
  return [0, 1, 2].map(() => ({ name: '', price: '', cells: { ...cells } }));
}
const str = (x: unknown) => (typeof x === 'string' ? x : '');
function readCmpV2(raw: string): Vendor[] | null {
  const v = JSON.parse(raw) as unknown;
  if (!Array.isArray(v) || v.length !== 3) return null;
  return v.map((x: { name?: unknown; price?: unknown; cells?: Record<string, unknown> } | null) => ({
    name: str(x?.name), price: str(x?.price),
    cells: Object.fromEntries(COMPARE_ROWS.map((r) => {
      const c = str(x?.cells?.[r]);
      return [r, YN_ROWS.includes(r) && !(YN as readonly string[]).includes(c) ? '' : c];
    })) as Record<CompareRowId, string>,
  }));
}
export function loadCompare(s: Storage | null): Vendor[] {
  try {
    if (!s) return emptyCompare();
    const raw = s.getItem(KEY_CMP);
    if (raw) return readCmpV2(raw) ?? emptyCompare();
    const old = s.getItem(KEY_CMP_V1); if (old === null) return emptyCompare();
    let out: Vendor[] | null = null;
    try { out = migrateCompareV1(JSON.parse(old)); } catch { out = null; }
    if (out) saveCompare(s, out);
    try { s.removeItem(KEY_CMP_V1); } catch { /* 지울 수 없으면 다음에 다시 버린다 */ }
    return out ?? emptyCompare();
  } catch { return emptyCompare(); }
}
export function saveCompare(s: Storage | null, v: Vendor[]): boolean {
  try { if (!s) return false; s.setItem(KEY_CMP, JSON.stringify(v)); return true; } catch { return false; }
}
