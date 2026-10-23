import type { Answers, StepId } from './types';

export const REQUIRED: StepId[] = ['kind', 'goal'];

export const ALL: StepId[] = ['mode', 'renew', 'kind', 'goal', 'audience', 'pages', 'features', 'links', 'content', 'brand', 'design', 'ops', 'own', 'scope', 'when'];

/** 지금 답에서 보이는 단계 — 고치기일 때만 renew */
export function visibleSteps(a: Answers): StepId[] {
  return ALL.filter((s) => s !== 'renew' || a.mode === 'renew');
}

export function isAnswered(a: Answers, id: StepId): boolean {
  if (id === 'kind') return !!a.kind && (a.kind !== 'other' || a.kindOther.trim().length > 0);
  if (id === 'goal') return !!a.goalMain;
  return true;
}

/** 진행 표시 묶음 — 분기로 단계 수가 바뀌어도 묶음 수는 그대로(명세 §11). 묶음 이름은 문구 파일(ui.phases)에서 같은 순서로 */
export const PHASES: { steps: StepId[] }[] = [
  { steps: ['mode', 'renew', 'kind', 'goal', 'audience'] },
  { steps: ['pages', 'features', 'links'] },
  { steps: ['content', 'brand', 'design', 'ops'] },
  { steps: ['own', 'scope', 'when'] },
];

export function phaseOf(id: StepId): number {
  return PHASES.findIndex((p) => p.steps.includes(id));
}
