import type { Answers, StepId } from './types';
import { ALL } from './steps';

export function emptyAnswers(): Answers {
  return {
    v: 1, renewUrl: '', renewPain: '', kindOther: '', name: '', goalMore: [], audience: [], pages: [], pagesExtra: '',
    features: {}, featuresUnknown: false, langs: [], langOther: '', links: [], contentBy: '', brand: [], refs: [], dislikes: '',
    ops: [], own: { domain: '내 이름으로', hosting: '내 이름으로', admin: '대표 계정은 내가', source: '오픈 때 받기' },
    monthlyCost: true, openDate: '', openUnknown: false, budgetInBrief: false,
  };
}


const KEY = 'prologue.brief.v1';
const KEY_CMP = 'prologue.brief.compare.v1';
export type Saved = { answers: Answers; step: StepId; done: boolean };

/** 브라우저 저장소. 시크릿 창·차단이면 null 또는 접근 때 예외 — 모든 접근을 감싼다 */
export function browserStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export function storageOk(s: Storage | null): boolean {
  if (!s) return false;
  try { s.setItem('prologue.brief.probe', '1'); s.removeItem('prologue.brief.probe'); return true; } catch { return false; }
}

/** 같은 v1 안에서도 손으로 고쳤거나 형식이 어긋난 값은 버린다 — 그대로 그리면 화면 전체가 오류로 멈춘다 */
function shapeOk(a: Answers): boolean {
  const empty = emptyAnswers() as Record<string, unknown>;
  const got = a as Record<string, unknown>;
  for (const k of Object.keys(empty)) {
    const e = empty[k], g = got[k];
    if (Array.isArray(e) ? !Array.isArray(g) : typeof e !== typeof g || (typeof e === 'object' && g === null)) return false;
  }
  return Object.values(a.own).every((x) => typeof x === 'string') && a.refs.every((r) => r && typeof r.url === 'string' && Array.isArray(r.likes));
}

export function loadSaved(s: Storage | null): Saved | null {
  try {
    const raw = s?.getItem(KEY); if (!raw) return null;
    const v = JSON.parse(raw) as Saved;
    if (!v || v.answers?.v !== 1 || !ALL.includes(v.step)) return null;
    const answers = { ...emptyAnswers(), ...v.answers, own: { ...emptyAnswers().own, ...v.answers.own } };
    if (!shapeOk(answers)) return null;
    return { answers, step: v.step, done: !!v.done };
  } catch { return null; }
}

export function saveSaved(s: Storage | null, v: Saved): boolean {
  try { if (!s) return false; s.setItem(KEY, JSON.stringify(v)); return true; } catch { return false; }
}

export function clearBrief(s: Storage | null): void {
  try { s?.removeItem(KEY); s?.removeItem(KEY_CMP); } catch { /* 저장이 막혀 있으면 지울 것도 없다 */ }
}

export const COMPARE_ROWS = ['꼭 필요한 기능 포함', '도메인 내 이름', '소스·파일 받음', '수정 횟수', '매달 비용', '오픈 가능일'] as const;
export type CompareRow = (typeof COMPARE_ROWS)[number];
export type Vendor = { name: string; price: string; cells: Record<CompareRow, string> };

export function emptyCompare(): Vendor[] {
  const cells = Object.fromEntries(COMPARE_ROWS.map((r) => [r, ''])) as Record<CompareRow, string>;
  return ['A 업체', 'B 업체', 'C 업체'].map((name) => ({ name, price: '', cells: { ...cells } }));
}
export function loadCompare(s: Storage | null): Vendor[] {
  try { const raw = s?.getItem(KEY_CMP); const v = raw ? (JSON.parse(raw) as Vendor[]) : null; return Array.isArray(v) && v.length === 3 ? v : emptyCompare(); }
  catch { return emptyCompare(); }
}
export function saveCompare(s: Storage | null, v: Vendor[]): boolean {
  try { if (!s) return false; s.setItem(KEY_CMP, JSON.stringify(v)); return true; } catch { return false; }
}
