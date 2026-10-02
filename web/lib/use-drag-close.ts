'use client';
import { useRef, type PointerEvent, type RefObject } from 'react';

/** 손잡이를 아래로 끌어 닫기 — 끄는 동안 대상이 손가락을 따라 내려오고, threshold 를 넘기면 닫는다 */
export function useDragClose(target: RefObject<HTMLElement | null>, onClose: () => void, threshold = 90) {
  const y0 = useRef<number | null>(null);
  const end = (e: PointerEvent, cancel: boolean) => {
    if (y0.current === null || !target.current) return;
    const dy = e.clientY - y0.current;
    y0.current = null;
    target.current.style.transition = '';
    target.current.style.transform = '';
    if (!cancel && dy > threshold) onClose();
  };
  return {
    onPointerDown: (e: PointerEvent) => {
      if (!target.current) return;
      y0.current = e.clientY;
      target.current.style.transition = 'none';
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent) => {
      if (y0.current === null || !target.current) return;
      target.current.style.transform = `translateY(${Math.max(0, e.clientY - y0.current)}px)`;
    },
    onPointerUp: (e: PointerEvent) => end(e, false),
    onPointerCancel: (e: PointerEvent) => end(e, true),
  };
}
