'use client';
import { useEffect, useState, type RefObject } from 'react';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 구간(120vh) 안에서 판을 top 64 에 붙이고 진행률 t 를 돌려준다 */
export function useDwell(ref: RefObject<HTMLElement | null>, steps: 2 | 3): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const desktop = () => window.matchMedia('(min-width:1024px)').matches;

    const onScroll = () => {
      const pan = el.querySelector<HTMLElement>('[data-pan]');
      if (!pan) return;
      if (!desktop()) { pan.style.transform = ''; setT(1); return; }
      const r = el.getBoundingClientRect();
      const range = Math.max(1, r.height - pan.offsetHeight);
      const off = clamp(64 - r.top, 0, range);
      // CSS position:sticky 는 이 환경에서 붙지 않는다(2026-09-22 확인) — JS translateY 로 붙인다
      pan.style.transform = off ? `translate3d(0, ${off.toFixed(1)}px, 0)` : '';
      const raw = off / range;
      setT(reduced ? (raw >= 0.5 ? 1 : 0) : raw);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [ref, steps]);
  return t;
}
