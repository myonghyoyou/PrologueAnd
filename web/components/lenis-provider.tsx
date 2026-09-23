'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

let current: Lenis | null = null;
export const getLenis = () => current;

/** 부드러운 스크롤 — 목록·상세 모두(명세 §6). 모션 줄이기면 켜지 않는다 */
export function LenisProvider() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const l = new Lenis({ lerp: 0.1, smoothWheel: true });
    current = l;
    (window as unknown as { __lenis?: Lenis }).__lenis = l;   // 테스트가 스크롤을 옮길 통로
    let raf = 0;
    const tick = (t: number) => { l.raf(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); l.destroy(); current = null; delete (window as unknown as { __lenis?: Lenis }).__lenis; };
  }, []);
  return null;
}
