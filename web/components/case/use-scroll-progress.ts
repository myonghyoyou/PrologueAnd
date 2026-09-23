'use client';
import { useEffect, useState, type RefObject } from 'react';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 모션 줄이기 설정 */
export function useReducedMotion(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => { setR(window.matchMedia('(prefers-reduced-motion:reduce)').matches); }, []);
  return r;
}

/** 스크롤할 때마다 el 의 위치로 진행률(0~1)을 잰다. fixed 를 주면 그 값에 고정.
 *  calc 는 모듈 수준 함수로 넘긴다 — 렌더마다 새로 만들면 효과가 매번 다시 돈다 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, calc: (r: DOMRect, vh: number) => number, fixed?: number): number {
  const [t, setT] = useState(fixed ?? 0);
  useEffect(() => {
    if (fixed !== undefined) { setT(fixed); return; }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => { raf = 0; setT(clamp01(calc(el.getBoundingClientRect(), window.innerHeight))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [ref, calc, fixed]);
  return t;
}
