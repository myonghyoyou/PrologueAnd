import type { Facts, ItemState, OptId, QId } from '@/lib/ownership/types';

/** 질문 규칙 — 언어 없음. 화면 글자는 copy/<언어>.ts. 명세 4절 */
export type Question = { id: QId; phase: 0 | 1 | 2; opts: OptId[]; show: (f: Facts) => boolean; judge: Partial<Record<OptId, ItemState>> };

const YN: OptId[] = ['yes', 'no', 'unknown'];
const yn = (no: ItemState) => ({ yes: 'ok', no, unknown: 'check' }) as const;

export const QUESTIONS: Question[] = [
  { id: 'registrarLogin', phase: 0, opts: YN, show: (f) => !f.builderOnly, judge: yn('risk') },
  { id: 'registrantIsMe', phase: 0, opts: YN, show: (f) => f.registrant !== null, judge: yn('risk') },
  { id: 'dnsLogin', phase: 0, opts: YN, show: (f) => !f.builderOnly && f.nsDiffers !== 'no', judge: yn('risk') },
  { id: 'hostLogin', phase: 0, opts: YN, show: () => true, judge: yn('risk') },
  { id: 'renewalCard', phase: 0, opts: ['mine', 'vendor', 'unknown'], show: (f) => !f.builderOnly, judge: { mine: 'ok', vendor: 'check', unknown: 'check' } },
  { id: 'adminAccount', phase: 1, opts: YN, show: () => true, judge: yn('risk') },
  { id: 'selfEdit', phase: 1, opts: YN, show: () => true, judge: yn('check') },
  { id: 'backup', phase: 1, opts: YN, show: (f) => !f.isBuilder, judge: yn('check') },
  { id: 'builderAccount', phase: 1, opts: YN, show: (f) => f.isBuilder, judge: yn('risk') },
  { id: 'contract', phase: 1, opts: YN, show: () => true, judge: yn('check') },
  { id: 'mailAdmin', phase: 2, opts: ['mine', 'vendor', 'none', 'unknown'], show: (f) => f.mail !== 'none', judge: { mine: 'ok', vendor: 'risk', none: 'ok', unknown: 'check' } },
  { id: 'mapAdmin', phase: 2, opts: ['mine', 'vendor', 'none', 'unknown'], show: () => true, judge: { mine: 'ok', vendor: 'risk', none: 'ok', unknown: 'check' } },
];

/** 진행 표시 묶음 — 계정 로그인 / 관리자·보관물 / 메일·지도 */
export const PHASES = ['login', 'keep', 'mailmap'] as const;
