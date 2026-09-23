'use client';
import { useState } from 'react';
import type { Spot } from '@/content';
import s from './hotspots.module.css';

export function SpotList({ spots, onHover }: { spots: Spot[]; onHover: (i: number) => void }) {
  return (
    <ul className={s.spots} onMouseLeave={() => onHover(-1)}>
      {spots.map((sp, i) => (
        <li key={i} data-spot={i} onMouseEnter={() => onHover(i)}>
          <b>{i + 1}</b>
          <span>{sp.cap}</span>
        </li>
      ))}
    </ul>
  );
}

export function SpotOverlay({ spots, active }: { spots: Spot[]; active: number }) {
  const sp = active >= 0 ? spots[active] : null;
  return (
    <>
      {spots.map((p, i) => (
        <b key={i} aria-hidden style={{ position: 'absolute', zIndex: 4, width: 18, height: 18, margin: '-9px 0 0 -9px',
             left: `calc(6px + (100% - 12px) * ${p.x / 100})`, top: `calc(6px + (100% - 12px) * ${p.y / 100})`,
             borderRadius: '50%', background: 'var(--navy-800)', color: 'var(--bone-50)', fontSize: 11,
             display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</b>
      ))}
      <i data-spot-hl aria-hidden style={{ position: 'absolute', boxSizing: 'border-box', border: '1.5px solid var(--navy-800)',
           boxShadow: '0 0 0 9999px rgba(250,249,246,.62)', transition: 'opacity .15s', zIndex: 3, pointerEvents: 'none',
           opacity: sp ? 1 : 0,
           left: `calc(6px + (100% - 12px) * ${(sp?.x ?? 0) / 100})`, top: `calc(6px + (100% - 12px) * ${(sp?.y ?? 0) / 100})`,
           width: `calc((100% - 12px) * ${(sp?.w ?? 0) / 100})`, height: `calc((100% - 12px) * ${(sp?.h ?? 0) / 100})` }} />
    </>
  );
}
