import type { ItemId, ItemState, OptId, QId } from '@/lib/ownership/types';

/** 권한 점검 문구 — 언어마다 이 타입 하나를 채운다(키가 빠지면 타입 검사에서 실패).
 *  끼워 넣는 자리: {r} 회사 이름, {n} 등록인·개수, {d} 도메인, {date} 날짜, {days} 남은 날, {time} 조회 시각 */
export type QCopy = { title: string; titleNoName?: string; opts: Partial<Record<OptId, string>> };
export type ItemCopy = { name: string; why: string; how: string };
export type SheetRow = 'domain' | 'registrar' | 'expiry' | 'dns' | 'host' | 'mail' | 'map' | 'admin' | 'backup' | 'contract';

export type OwnershipCopy = {
  dateLocale: string;
  meta: { title: string; desc: string };
  intro: { h1: string; lead: string; label: string; placeholder: string; submit: string; checking: string; privacy: string; langLabel: string };
  errors: { empty: string; shape: string; notFound: string };
  lookup: {
    heading: string; trimmed: string; builderOnly: string; unsupported: string; failed: string; retry: string; next: string; source: string;
    rows: { expiry: string; registrar: string; registrant: string; dns: string; mail: string; host: string };
    expiry: { past: string; soon: string; ok: string; none: string };
    noMail: string; unknown: string; hidden: string;
  };
  phases: { login: string; keep: string; mailmap: string };
  q: Record<QId, QCopy>;
  items: Record<ItemId, ItemCopy>;
  /** 모르겠어요·답 없음 항목의 이유 — 아직 모르는 것을 단정하지 않는다 */
  unknownWhy: string;
  state: Record<ItemState, string>;
  headline: Record<ItemState, string>;
  headlineOne: { risk: string; check: string };
  vendor: { heading: string; intro: string; lines: Record<ItemId, string>; outro: string; copy: string; copied: string; copyFail: string };
  sheet: {
    heading: string; lead: string; checkedOn: string; cols: { item: string; where: string; id: string; pw: string };
    rows: Record<SheetRow, string>; print: string; inApp: string; copyUrl: string; urlCopied: string;
  };
  nav: { prev: string; next: string; toResult: string; edit: string; reset: string; resetConfirm: string; noStore: string; toBrief: string };
};
