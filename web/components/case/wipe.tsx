'use client';
import type { ReactNode } from 'react';
import s from './wipe.module.css';

export function Wipe({ t, before, after, caps }: {
  t: number; before: ReactNode; after: ReactNode; caps: [string, string];
}) {
  const pct = (100 - t * 100).toFixed(2);
  return (
    <>
      <div data-fit="stack" className={s.stack}>
        <div data-wipe-before className={s.layer}>{before}</div>
        <div data-wipe-after className={`${s.layer} ${s.after}`} style={{ clipPath: `inset(0 ${pct}% 0 0)` }}>{after}</div>
        <i aria-hidden data-wipe-edge className={s.edge} style={{ left: `calc(${(t * 100).toFixed(2)}% - 1px)` }} />
      </div>
      <div data-cap className={s.caps} style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 'clamp(12px,.9vw,15px)', color: 'var(--bone-500)', width: 'var(--dw, 100%)' }}>
        <span style={{ opacity: t < 0.5 ? 1 : 0.35, transition: 'opacity .3s' }}>{caps[0]}</span>
        <span style={{ color: 'var(--bone-400)' }}>→</span>
        <span style={{ opacity: t < 0.5 ? 0.35 : 1, transition: 'opacity .3s' }}>{caps[1]}</span>
      </div>
    </>
  );
}
