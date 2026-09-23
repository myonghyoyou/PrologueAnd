'use client';
import { useCallback, useEffect, useRef } from 'react';
import { getLenis } from '../lenis-provider';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const WHEEL = { gap: 100, first: 90, more: 480 };
const LOCK = 160;
const DUR = 0.55;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useStations() {
  const target = useRef<number | null>(null);

  const stops = useCallback((): number[] => {
    const out: number[] = [];
    document.querySelectorAll<HTMLElement>('[data-pan]').forEach((pan) => {
      const dwell = pan.closest<HTMLElement>('[data-dwell]');
      if (!dwell) { out.push(pan.getBoundingClientRect().top + window.scrollY - 64); return; }
      const y0 = dwell.getBoundingClientRect().top + window.scrollY;
      const range = dwell.offsetHeight - pan.offsetHeight;
      const ks = dwell.dataset.dwell === '2' ? [0, 1] : [0, 0.5, 1];
      ks.forEach((k) => out.push(y0 + range * k));
    });
    return out.map((y) => Math.max(0, Math.round(y))).sort((a, b) => a - b);
  }, []);

  const goY = useCallback((y: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = clamp(y, 0, max);
    target.current = to;
    const l = getLenis();
    if (l) l.scrollTo(to, { duration: DUR, easing: easeOutCubic, lock: true, onComplete: () => { target.current = null; } });
    else window.scrollTo({ top: to, behavior: 'smooth' });   // 모션 줄이기: Lenis 가 없다
  }, []);

  const goStop = useCallback((dir: 1 | -1) => {
    const st = stops();
    const from = target.current ?? window.scrollY;
    let k = 0;
    st.forEach((y, i) => { if (y <= from + 2) k = i; });
    goY(st[clamp(k + dir, 0, st.length - 1)]);
  }, [stops, goY]);

  useEffect(() => {
    if (!window.matchMedia('(min-width:1024px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    history.scrollRestoration = 'manual';

    let acc = 0, lastEv = 0, stepped = false, streamStart = 0, lockUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;                                   // 브라우저 확대는 건드리지 않는다
      if (document.documentElement.hasAttribute('data-drawer-open')) return;
      e.preventDefault();
      const d = e.deltaY;
      if (!d) return;
      const now = performance.now(), gap = now - lastEv; lastEv = now;
      if (gap > WHEEL.gap) { acc = 0; stepped = false; streamStart = now; }
      acc += d;
      const fire = (dir: 1 | -1) => { if (now < lockUntil) return; goStop(dir); lockUntil = now + LOCK; };
      if (!stepped) { if (Math.abs(acc) >= WHEEL.first) { fire(acc > 0 ? 1 : -1); acc = 0; stepped = true; } return; }
      if (now - streamStart > 300 && Math.abs(acc) >= WHEEL.more) { fire(acc > 0 ? 1 : -1); acc = 0; }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (document.documentElement.hasAttribute('data-drawer-open')) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goStop(1); }
      else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goStop(-1); }
      else if (e.key === 'Home') { e.preventDefault(); goY(0); }
      else if (e.key === 'End') { e.preventDefault(); goY(document.documentElement.scrollHeight - window.innerHeight); }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [goStop, goY]);

  return { goStop, stops };
}
