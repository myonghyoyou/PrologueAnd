import type { Answers, StepId } from './types';

export const REQUIRED: StepId[] = ['kind', 'goal'];

export const ALL: StepId[] = ['mode', 'renew', 'kind', 'goal', 'audience', 'pages', 'features', 'links', 'content', 'brand', 'design', 'ops', 'own', 'scope', 'when'];

/** 지금 답에서 보이는 단계 — 고치기일 때만 renew */
export function visibleSteps(a: Answers): StepId[] {
  return ALL.filter((s) => s !== 'renew' || a.mode === 'renew');
}

export function isAnswered(a: Answers, id: StepId): boolean {
  if (id === 'kind') return !!a.kind && (a.kind !== '직접 입력' || a.kindOther.trim().length > 0);
  if (id === 'goal') return !!a.goalMain;
  return true;
}
