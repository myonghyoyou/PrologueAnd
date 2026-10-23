'use client';
import { useEffect, useState } from 'react';
import { ui } from '@/components/ui/controls';
import { isInAppBrowser } from '@/lib/brief/in-app';
import type { OwnershipCopy } from '@/content/ownership/copy/types';
import type { Facts, Locale } from '@/lib/ownership/types';
import { fill, sheetRows } from '@/lib/ownership/verdict';
import s from './sheet.module.css';

type P = { c: OwnershipCopy; locale: Locale; facts: Facts; domain: string };

/** 내 홈페이지 계정 정리표 — 아는 값만 채우고, 아이디·비밀번호 보관 위치는 늘 빈칸(입력받지 않는다).
 *  인쇄하면 이 표만 한 장으로 나온다. 쓰레드 같은 앱 안 브라우저는 인쇄가 막혀 있어 다른 브라우저로 여는 길을 먼저 보인다 */
export function Sheet({ c, locale, facts, domain }: P) {
  const rows = sheetRows(facts, c, locale, domain);
  const today = new Intl.DateTimeFormat(c.dateLocale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  const [inApp, setInApp] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  useEffect(() => { setInApp(isInAppBrowser(navigator.userAgent)); }, []);
  const copyUrl = async () => { try { await navigator.clipboard.writeText(location.href); setUrlCopied(true); } catch { /* 길게 눌러 주소를 복사할 수 있다 */ } };
  return (
    <section className={s.sheet} data-own-sheet>
      <h2 className={s.h2}>{c.sheet.heading}</h2>
      <p className={s.lead}>{c.sheet.lead}</p>
      <p className={s.date}>{fill(c.sheet.checkedOn, { date: today })}</p>
      <div className={s.wrap}>
        <table className={s.table}>
          <thead><tr><th scope="col">{c.sheet.cols.item}</th><th scope="col">{c.sheet.cols.where}</th><th scope="col">{c.sheet.cols.id}</th><th scope="col">{c.sheet.cols.pw}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} data-own-sheet-row={r.key}>
                <th scope="row">{r.label}</th>
                <td>{r.where}{r.login ? <><br /><span className={s.login}>{r.login}</span></> : null}</td>
                <td data-own-blank />
                <td data-own-blank />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={s.actions}>
        {inApp ? (
          <div className={s.inapp}>
            <p data-own-inapp>{c.sheet.inApp}</p>
            <button type="button" className={`${ui.btn} ${ui.pri}`} onClick={copyUrl} data-own-copyurl>{c.sheet.copyUrl}</button>
            {urlCopied ? <span className={s.copied}> {c.sheet.urlCopied}</span> : null}
          </div>
        ) : null}
        <button type="button" className={`${ui.btn} ${inApp ? ui.sec : ui.pri}`} onClick={() => window.print()} data-own-print>{c.sheet.print}</button>
      </div>
    </section>
  );
}
