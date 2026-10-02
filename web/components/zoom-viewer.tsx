'use client';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { getLenis } from './lenis-provider';
import { useBackClose } from '@/lib/use-back-close';
import { useDragClose } from '@/lib/use-drag-close';
import s from './zoom-viewer.module.css';

type Pin = { n: string; x: number; y: number; text: string };
type View = { src: string; alt: string; pins: Pin[] };
const ZOOM = 2.6, MAX = 4;

/** 2A 캡처 확대 뷰어(폰) — 문서에 하나. [data-zoom] 를 누르면 원본으로 연다(명세 §3-2) */
export function ZoomViewer() {
  const [v, setV] = useState<View | null>(null);
  const [scale, setScale] = useState(1);
  const [tip, setTip] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setV(null), []);
  const drag = useDragClose(root, close, 110);
  useBackClose(!!v, close);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!window.matchMedia('(max-width:1023px)').matches) return;
      const t = e.target as HTMLElement;
      const box = t.closest<HTMLElement>('[data-zoom]');
      if (!box || t.closest('a, button, [data-spot], [data-side-toggle]')) return;
      e.preventDefault();
      setScale(1);
      setV({ src: box.dataset.zoom!, alt: box.dataset.zoomAlt ?? '', pins: box.dataset.zoomPins ? JSON.parse(box.dataset.zoomPins) : [] });
      setTip(true);
      setTimeout(() => setTip(false), 1500);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!v) return;
    const l = getLenis(); l?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { l?.start(); document.documentElement.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [v, close]);

  /** 확대 배율을 바꾸며 (cx,cy) 화면 점이 같은 그림 자리에 머물게 스크롤을 맞춘다 */
  const zoomAt = (to: number, cx: number, cy: number) => {
    const st = stage.current; if (!st) return;
    const r = st.getBoundingClientRect();
    const fx = (st.scrollLeft + cx - r.left) / st.scrollWidth, fy = (st.scrollTop + cy - r.top) / st.scrollHeight;
    setScale(to);
    requestAnimationFrame(() => { st.scrollLeft = fx * st.scrollWidth - (cx - r.left); st.scrollTop = fy * st.scrollHeight - (cy - r.top); });
  };
  const goPin = (p: Pin) => {
    const st = stage.current; if (!st) return;
    setScale(ZOOM);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const img = st.querySelector('img')!;
      st.scrollTo({ left: img.offsetLeft + img.offsetWidth * p.x / 100 - st.clientWidth / 2, top: img.offsetTop + img.offsetHeight * p.y / 100 - st.clientHeight / 2, behavior: 'smooth' });
    }));
  };

  // 두 번 누르기 · 두 손가락 벌리기
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const lastTap = useRef(0);
  const dist = () => { const [a, b] = [...pts.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const onDown = (e: PointerEvent) => {
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2) pinch.current = { d: dist(), s: scale };
  };
  const onMove = (e: PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pts.current.size === 2) setScale(Math.min(MAX, Math.max(1, pinch.current.s * dist() / pinch.current.d)));
  };
  const onUp = (e: PointerEvent) => {
    const wasPinch = !!pinch.current;
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    if (wasPinch) return;
    const now = performance.now();
    if (now - lastTap.current < 300) { zoomAt(scale > 1 ? 1 : ZOOM, e.clientX, e.clientY); lastTap.current = 0; }
    else lastTap.current = now;
  };

  return (
    <div ref={root} className={s.root} hidden={!v} role="dialog" aria-modal="true" aria-label="캡처 크게 보기" data-zoom-viewer data-lenis-prevent>
      <div className={s.top} data-zoom-top {...drag}>
        <span>두 번 눌러 확대</span>
        <button type="button" className={s.close} onClick={close} aria-label="닫기" data-zoom-close onPointerDown={(e) => e.stopPropagation()}>×</button>
      </div>
      <div ref={stage} className={s.stage} data-zoom-stage onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {v ? <img src={v.src} alt={v.alt} className={s.img} style={{ width: `${scale * 100}%` }} data-zoom-img draggable={false} /> : null}
      </div>
      {tip ? <p className={s.tip}>두 손가락으로 벌리거나, 두 번 누르세요</p> : null}
      {v?.pins.length ? (
        <div className={s.pins}>
          {v.pins.map((p) => (
            <button key={p.n} type="button" onClick={() => goPin(p)} data-zoom-pin><b>{p.n}</b><span>{p.text}</span></button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
