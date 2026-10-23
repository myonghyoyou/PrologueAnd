'use client';
import { useId } from 'react';
import { ui } from '@/components/ui/controls';
import type { OwnershipCopy } from '@/content/ownership/copy/types';
import s from './ownership.module.css';

type P = { c: OwnershipCopy; value: string; onChange: (v: string) => void; onSubmit: () => void; busy: boolean; error: string; langHref: string };

/** 첫 화면 — 도구 소개, 주소 입력, 저장 안내 */
export function DomainStep({ c, value, onChange, onSubmit, busy, error, langHref }: P) {
  const id = useId();
  return (
    <section className={s.intro}>
      <a className={`${ui.txt} ${s.lang}`} href={langHref} data-own-lang>{c.intro.langLabel}</a>
      <h1 className={s.h1}>{c.intro.h1}</h1>
      <p className={s.lead}>{c.intro.lead}</p>
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); onSubmit(); }} noValidate>
        <label className={s.label} htmlFor={id}>{c.intro.label}</label>
        <div className={s.row}>
          <input id={id} className={s.input} type="text" inputMode="url" autoComplete="url" autoCapitalize="off" spellCheck={false}
            placeholder={c.intro.placeholder} value={value} onChange={(e) => onChange(e.target.value)} data-own-input
            aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
          {/* 조회 중에도 다시 누를 수 있다 — 주소를 고쳐 다시 조회하면 앞 조회 결과는 버린다 */}
          <button type="submit" className={`${ui.btn} ${ui.pri}`} data-own-submit>{c.intro.submit}</button>
        </div>
        {busy ? <p className={s.note} aria-live="polite">{c.intro.checking}</p> : null}
        {error ? <p id={`${id}-err`} className={s.error} role="alert" data-own-error>{error}</p> : null}
      </form>
      <p className={s.privacy}>{c.intro.privacy}</p>
    </section>
  );
}
