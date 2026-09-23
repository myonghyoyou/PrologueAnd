'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

let current: Lenis | null = null;
export const getLenis = () => current;

export function LenisProvider() {
  const path = usePathname();
  const isCase = /^\/projects\/[^/]+$/.test(path);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;   // 시안 v3.js:40
    const l = new Lenis({ lerp: 0.1, smoothWheel: !isCase });                   // 시안 v3.js:41
    current = l;
    (window as unknown as { __lenis?: Lenis }).__lenis = l;                     // 테스트가 스크롤을 옮길 통로
    let raf = 0;
    const tick = (t: number) => { l.raf(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); l.destroy(); current = null; delete (window as unknown as { __lenis?: Lenis }).__lenis; };
  }, [isCase]);

  return null;
}
