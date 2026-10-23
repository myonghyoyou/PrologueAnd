import type { Answers, Facts, ItemId, ItemState, Locale, Provider, QId } from './types';
import type { OwnershipCopy, SheetRow } from '@/content/ownership/copy/types';
import { QUESTIONS } from '@/content/ownership/rules';

export type Item = { id: ItemId; state: ItemState; value: string | null };

/** 문구의 {자리}를 채운다 */
export const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);

export const providerName = (p: Provider | null, locale: Locale) => (p ? p.name[locale] : null);

export function visibleQuestions(f: Facts): QId[] {
  return QUESTIONS.filter((q) => q.show(f)).map((q) => q.id);
}

const ORDER: Record<ItemState, number> = { risk: 0, check: 1, ok: 2 };

/** 판정 항목 — 자동 확인한 것 + 지금 보이는 질문의 답만(안 보이는 질문의 옛 답은 쓰지 않는다). 위험 → 확인 필요 → 안전 */
export function items(f: Facts, a: Answers): Item[] {
  const list: Item[] = [];
  if (f.expiry) list.push({ id: 'expiry', state: f.expiry.state, value: f.expiry.date });
  if (f.builderOnly) list.push({ id: 'ownDomain', state: 'check', value: null });
  for (const q of QUESTIONS) {
    const ans = a[q.id];
    if (!ans || !q.show(f)) continue;
    const st = q.judge[ans];
    if (st) list.push({ id: q.id, state: st, value: ans });
  }
  return list.map((it, i) => ({ it, i })).sort((x, y) => ORDER[x.it.state] - ORDER[y.it.state] || x.i - y.i).map((x) => x.it);
}

export function headline(list: Item[]): { kind: ItemState; n: number } {
  const risk = list.filter((i) => i.state === 'risk').length;
  if (risk) return { kind: 'risk', n: risk };
  const check = list.filter((i) => i.state === 'check').length;
  return check ? { kind: 'check', n: check } : { kind: 'ok', n: 0 };
}

/** 업체에 보낼 부탁 — 위험·확인 필요 항목만 번호를 붙여 */
export function vendorMessage(list: Item[], _f: Facts, c: OwnershipCopy, domain: string): string {
  const lines = list.filter((i) => i.state !== 'ok').map((i, n) => `${n + 1}. ${fill(c.vendor.lines[i.id], { d: domain })}`);
  return [c.vendor.intro, '', ...lines, '', c.vendor.outro].join('\n');
}

export type SheetLine = { key: SheetRow; label: string; where: string; login: string | null };

const fmtDate = (iso: string, c: OwnershipCopy) => new Intl.DateTimeFormat(c.dateLocale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/** 계정 정리표 — 아는 값만 채우고 나머지는 빈칸(아이디·비밀번호 칸은 화면에서 늘 빈칸) */
export function sheetRows(f: Facts, c: OwnershipCopy, locale: Locale, domain: string): SheetLine[] {
  const name = (p: Provider | null, raw: string) => providerName(p, locale) ?? raw;
  const mail = f.mail === 'none' ? c.lookup.noMail : f.mail === 'unknown' ? '' : name(f.mail, '');
  const where: Record<SheetRow, [string, string | null]> = {
    domain: [domain, null],
    registrar: [name(f.registrar, f.registrarRaw ?? ''), f.registrar?.login ?? null],
    expiry: [f.expiry ? fmtDate(f.expiry.date, c) : '', null],
    dns: [name(f.nsProvider, f.nsRaw.join(', ')), f.nsProvider && f.nsProvider !== f.registrar ? f.nsProvider.login ?? null : null],
    host: [name(f.host, ''), f.host?.login ?? null],
    mail: [mail, f.mail && typeof f.mail === 'object' ? f.mail.login ?? null : null],
    map: ['', null], admin: ['', null], backup: ['', null], contract: ['', null],
  };
  return (Object.keys(c.sheet.rows) as SheetRow[]).map((k) => ({ key: k, label: c.sheet.rows[k], where: where[k][0], login: where[k][1] }));
}
