import type { Answers, Lookup, OptId, QId } from './types';
import { QUESTIONS } from '@/content/ownership/rules';

/** 답과 조회 결과는 이 기기 브라우저에만 저장한다. 판정 값(위험·안전)은 저장하지 않는다 — 열 때마다 오늘 날짜로 다시 계산 */
const KEY = 'prologue.ownership.v1';
const PROBE = 'prologue.ownership.probe';

export type Saved = { v: 1; input: string; lookup: Lookup | null; answers: Answers; step: string; done: boolean };

/** 요청서 저장 코드와 따로 둔다 — 요청서 쪽이 바뀌어도 점검기가 깨지지 않게 */
export function ownershipStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export function ownershipStorageOk(s: Storage | null): boolean {
  if (!s) return false;
  try { s.setItem(PROBE, '1'); s.removeItem(PROBE); return true; } catch { return false; }
}

/** 지금 규칙에 있는 질문·선택지 답만 남긴다 */
function cleanAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const q of QUESTIONS) {
    const v = (raw as Record<string, unknown>)[q.id];
    if (typeof v === 'string' && q.opts.includes(v as OptId)) out[q.id as QId] = v as OptId;
  }
  return out;
}

export function loadOwnership(s: Storage | null): Saved | null {
  try {
    const raw = s?.getItem(KEY); if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Saved>;
    if (!v || v.v !== 1 || typeof v.input !== 'string' || typeof v.step !== 'string') return null;
    const lookup = v.lookup && typeof v.lookup === 'object' && typeof v.lookup.domain === 'string' && v.lookup.rdap ? v.lookup : null;
    return { v: 1, input: v.input, lookup, answers: cleanAnswers(v.answers), step: v.step, done: !!v.done };
  } catch { return null; }
}

export function saveOwnership(s: Storage | null, v: Saved): boolean {
  try { if (!s) return false; s.setItem(KEY, JSON.stringify(v)); return true; } catch { return false; }
}

export function clearOwnership(s: Storage | null): void {
  try { s?.removeItem(KEY); } catch { /* 저장이 막혀 있으면 지울 것도 없다 */ }
}
