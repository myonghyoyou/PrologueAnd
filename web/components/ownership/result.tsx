'use client';
import { useState } from 'react';
import { ui } from '@/components/ui/controls';
import type { OwnershipCopy } from '@/content/ownership/copy/types';
import type { Facts, Locale } from '@/lib/ownership/types';
import { headline, headlineText, vendorMessage, type Item } from '@/lib/ownership/verdict';
import s from './ownership.module.css';

type P = { c: OwnershipCopy; locale: Locale; domain: string; facts: Facts; list: Item[]; onEdit: () => void; onReset: () => void; sheet: React.ReactNode };

/** 결과 — 판정 한 줄, 항목(위험 → 확인 필요 → 안전), 업체에 보낼 부탁, 정리표 */
export function Result({ c, locale, domain, facts, list, onEdit, onReset, sheet }: P) {
  const h = headline(list);
  const msg = vendorMessage(list, facts, c, domain);
  const [copied, setCopied] = useState<'no' | 'yes' | 'fail'>('no');
  const copy = async () => {
    try { await navigator.clipboard.writeText(msg); setCopied('yes'); } catch { setCopied('fail'); }
  };
  return (
    <section className={s.result} data-own-result>
      <div className={s.noPrint}>
      <p className={s.domain}>{domain}</p>
      <h1 className={s.h1} data-own-headline data-kind={h.kind}>{headlineText(h, c)}</h1>
      <ul className={s.items}>
        {list.map((it) => (
          <li key={it.id} className={s.item} data-own-item={it.id} data-state={it.state}>
            <span className={s.state} data-state={it.state}>{c.state[it.state]}</span>
            <div>
              <p className={s.iname}>{c.items[it.id].name}</p>
              {it.state !== 'ok' ? <><p className={s.why}>{it.value === 'unknown' || (it.value === null && it.id !== 'expiry' && it.id !== 'ownDomain') ? c.unknownWhy : c.items[it.id].why}</p><p className={s.how}>{c.items[it.id].how}</p></> : null}
            </div>
          </li>
        ))}
      </ul>
      {h.kind !== 'ok' ? (
        <div className={s.vendor} data-own-vendor>
          <h2 className={s.h2}>{c.vendor.heading}</h2>
          <pre className={s.message} data-own-message>{msg}</pre>
          <button type="button" className={`${ui.btn} ${ui.pri}`} onClick={copy} data-own-copy>{c.vendor.copy}</button>
          {copied === 'yes' ? <span className={s.note} data-own-copied> {c.vendor.copied}</span> : null}
          {copied === 'fail' ? (
            <div data-own-copybox><textarea className={s.copybox} readOnly value={msg} rows={8} onFocus={(e) => e.currentTarget.select()} /><p className={s.note}>{c.vendor.copyFail}</p></div>
          ) : null}
        </div>
      ) : null}
      </div>
      {sheet}
      <div className={`${s.actions} ${s.noPrint}`}>
        <button type="button" className={`${ui.btn} ${ui.sec}`} onClick={onEdit} data-own-edit>{c.nav.edit}</button>
        <button type="button" className={ui.txt} onClick={onReset} data-own-reset>{c.nav.reset}</button>
      </div>
      {locale === 'ko' && c.nav.toBrief ? <p className={`${s.foot} ${s.noPrint}`}><a className={ui.txt} href="/tools/brief" data-own-to-brief>{c.nav.toBrief}</a></p> : null}
    </section>
  );
}
