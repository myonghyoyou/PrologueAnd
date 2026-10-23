'use client';
import { ui } from '@/components/ui/controls';
import type { OwnershipCopy } from '@/content/ownership/copy/types';
import type { Facts, Locale, Lookup } from '@/lib/ownership/types';
import { expiryState, noExpiry } from '@/lib/ownership/interpret';
import { fill, providerName } from '@/lib/ownership/verdict';
import s from './ownership.module.css';

type P = { c: OwnershipCopy; locale: Locale; display: string; trimmedFrom: string | null; lookup: Lookup | null; facts: Facts; now: Date; onRetry: () => void; onNext: () => void };

const fmtDate = (iso: string, c: OwnershipCopy) => new Intl.DateTimeFormat(c.dateLocale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
const fmtTime = (iso: string, c: OwnershipCopy) => new Intl.DateTimeFormat(c.dateLocale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

/** 공개 정보로 확인한 것 — 아는 값만 줄로 보이고, 확인 못 한 것은 질문으로 넘긴다 */
export function LookupPanel({ c, locale, display, trimmedFrom, lookup, facts: f, now, onRetry, onNext }: P) {
  const rows: [keyof OwnershipCopy['lookup']['rows'], string][] = [];
  if (f.expiry) {
    const { days } = expiryState(f.expiry.date, now);
    const t = days < 0 ? c.lookup.expiry.past : days <= 90 ? c.lookup.expiry.soon : c.lookup.expiry.ok;
    rows.push(['expiry', noExpiry(f.expiry.date) ? c.lookup.expiry.none : fill(t, { date: fmtDate(f.expiry.date, c), days: String(days) })]);
  }
  if (f.registrar || f.registrarRaw) rows.push(['registrar', providerName(f.registrar, locale) ?? f.registrarRaw!]);
  if (f.registrant) rows.push(['registrant', f.registrant]);
  if (f.nsRaw.length) rows.push(['dns', providerName(f.nsProvider, locale) ?? f.nsRaw.join(', ')]);
  if (f.mail !== 'unknown') rows.push(['mail', f.mail === 'none' ? c.lookup.noMail : providerName(f.mail, locale) ?? (lookup?.mx.status === 'ok' ? lookup.mx.value.join(', ') : c.lookup.unknown)]);
  if (f.host) rows.push(['host', providerName(f.host, locale)!]);

  const parts = lookup ? [lookup.rdap, lookup.ns, lookup.mx, lookup.a, lookup.cname] : [];
  const failed = parts.some((p) => p.status === 'failed' && p.reason !== 'unsupported');
  return (
    <section className={s.lookup} data-own-lookup aria-live="polite">
      <h2 className={s.h2}>{c.lookup.heading}</h2>
      <p className={s.domain}>{display}</p>
      {trimmedFrom ? <p className={s.note} data-own-trimmed>{fill(c.lookup.trimmed, { d: display })}</p> : null}
      {f.builderOnly ? <p className={s.note}>{c.lookup.builderOnly}</p> : null}
      {f.unsupported ? <p className={s.note}>{c.lookup.unsupported}</p> : null}
      {failed ? <p className={s.note}>{c.lookup.failed}</p> : null}
      {rows.length ? (
        <dl className={s.rows}>
          {rows.map(([k, v]) => (
            <div key={k} className={s.lrow} data-own-lookup-row={k}><dt>{c.lookup.rows[k]}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      ) : null}
      {lookup ? <p className={s.source}>{fill(c.lookup.source, { time: fmtTime(lookup.at, c) })}</p> : null}
      <div className={s.actions}>
        {failed ? <button type="button" className={`${ui.btn} ${ui.sec}`} onClick={onRetry} data-own-retry>{c.lookup.retry}</button> : null}
        <button type="button" className={`${ui.btn} ${ui.pri}`} onClick={onNext} data-own-next>{c.lookup.next}</button>
      </div>
    </section>
  );
}
