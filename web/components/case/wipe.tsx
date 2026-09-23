'use client';
import type { ReactNode } from 'react';

export function Wipe({ t, before, after, caps }: {
  t: number; before: ReactNode; after: ReactNode; caps: [string, string];
}) {
  const pct = (100 - t * 100).toFixed(2);
  return (
    <>
      <div data-fit="stack"
           style={{ position: 'relative', width: 'var(--dw, 100%)', maxWidth: '100%', aspectRatio: `${1280 + 12} / ${800 + 12}` }}>
        <div data-wipe-before style={{ position: 'absolute', inset: 0 }}>{before}</div>
        <div data-wipe-after style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${pct}% 0 0)` }}>{after}</div>
        <i aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${(t * 100).toFixed(2)}% - 1px)`,
             width: 2, background: 'var(--navy-800)', zIndex: 3, pointerEvents: 'none' }} />
      </div>
      <div data-cap style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 'clamp(12px,.9vw,15px)', color: 'var(--bone-500)', width: 'var(--dw, 100%)' }}>
        <span style={{ opacity: t < 0.5 ? 1 : 0.35, transition: 'opacity .3s' }}>{caps[0]}</span>
        <span style={{ color: 'var(--bone-400)' }}>→</span>
        <span style={{ opacity: t < 0.5 ? 0.35 : 1, transition: 'opacity .3s' }}>{caps[1]}</span>
      </div>
    </>
  );
}
