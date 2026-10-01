'use client';
import { useId } from 'react';
import type { Spot } from '@/content';
import s from './hotspots.module.css';

export function SpotList({ spots, active, onHover }: { spots: Spot[]; active: number; onHover: (i: number) => void }) {
  return (
    <ul className={s.spots} onMouseLeave={() => onHover(-1)}>
      {spots.map((sp, i) => (
        <li key={i} data-spot={i} tabIndex={0} className={active === i ? s.on : undefined}
            onMouseEnter={() => onHover(i)} onFocus={() => onHover(i)} onBlur={() => onHover(-1)}>
          <b>{i + 1}</b>
          <span>{sp.cap}</span>
        </li>
      ))}
    </ul>
  );
}

type Area = { x: number; y: number; w: number; h: number };
/** 그림 % 영역 → 틀(안쪽 여백 6px) 안의 위치 */
const box = (a: Area) => ({ left: `calc(6px + (100% - 12px) * ${a.x / 100})`, top: `calc(6px + (100% - 12px) * ${a.y / 100})`,
  width: `calc((100% - 12px) * ${a.w / 100})`, height: `calc((100% - 12px) * ${a.h / 100})` });

export function SpotOverlay({ spots, active }: { spots: Spot[]; active: number }) {
  const sp = active >= 0 ? spots[active] : null;
  const uid = useId().replace(/:/g, '');   // 한 페이지에 주석이 여럿 — mask id 가 겹치지 않게
  return (
    <>
      {spots.map((p, i) => (
        <b key={i} aria-hidden style={{ position: 'absolute', zIndex: 4, width: 18, height: 18, margin: '-9px 0 0 -9px',
             // 뱃지는 영역 왼쪽 위 모서리에 걸친다. 영역이 그림 가장자리에 붙어도 틀(overflow:hidden) 밖으로 잘리지 않게 9px 안쪽에서 멈춘다
             left: `max(9px, calc(6px + (100% - 12px) * ${p.x / 100}))`, top: `max(9px, calc(6px + (100% - 12px) * ${p.y / 100}))`,
             borderRadius: '50%', background: 'var(--navy-800)', color: 'var(--bone-50)', fontSize: 11,
             display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</b>
      ))}
      {/* 영역이 하나면 바깥을 상자 그림자로 흐리게, 여럿(also)이면 그림자가 서로를 덮으므로 구멍 뚫린 SVG 한 장으로 흐리게 한다 */}
      <i data-spot-hl aria-hidden style={{ position: 'absolute', boxSizing: 'border-box', border: '1.5px solid var(--navy-800)',
           boxShadow: sp?.also?.length ? 'none' : '0 0 0 9999px rgba(250,249,246,.62)', transition: 'opacity .15s', zIndex: 3, pointerEvents: 'none',
           opacity: sp ? 1 : 0, ...box(sp ?? { x: 0, y: 0, w: 0, h: 0 }) }} />
      {spots.map((p, i) => (p.also ?? []).map((a, j) => (
        <i key={`a${i}-${j}`} data-spot-hl-also aria-hidden style={{ position: 'absolute', boxSizing: 'border-box', border: '1.5px solid var(--navy-800)',
             transition: 'opacity .15s', zIndex: 3, pointerEvents: 'none', opacity: active === i ? 1 : 0, ...box(a) }} />
      )))}
      {spots.map((p, i) => p.also?.length ? (
        <svg key={`m${i}`} aria-hidden style={{ position: 'absolute', inset: 6, width: 'calc(100% - 12px)', height: 'calc(100% - 12px)', zIndex: 2,
             pointerEvents: 'none', overflow: 'visible', transition: 'opacity .15s', opacity: active === i ? 1 : 0 }}>
          <defs>
            <mask id={`spot-mask-${uid}-${i}`}>
              <rect x="-100%" y="-100%" width="300%" height="300%" fill="white" />
              {[p, ...p.also].map((a, j) => <rect key={j} x={`${a.x}%`} y={`${a.y}%`} width={`${a.w}%`} height={`${a.h}%`} fill="black" />)}
            </mask>
          </defs>
          <rect x="-100%" y="-100%" width="300%" height="300%" fill="rgba(250,249,246,.62)" mask={`url(#spot-mask-${uid}-${i})`} />
        </svg>
      ) : null)}
    </>
  );
}
