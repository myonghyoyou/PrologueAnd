'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getLenis } from './lenis-provider';
import { useBackClose } from '@/lib/use-back-close';
import { useDragClose } from '@/lib/use-drag-close';
import s from './bottom-sheet.module.css';

/** 아래 시트 — 막 · 손잡이 · 제목 · 닫기. 열려 있는 동안 페이지 스크롤을 잠그고, 다 닫히면 hidden(명세 §7) */
export function BottomSheet({ open, onClose, title, label, children }: {
  open: boolean; onClose: () => void; title: string; label: string; children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useDragClose(sheet, onClose);
  useBackClose(open, onClose);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)); });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const l = getLenis();
    l?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { l?.start(); document.documentElement.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  return (
    <div className={s.root} hidden={!mounted} data-bottom-sheet>
      <div className={shown ? `${s.dim} ${s.on}` : s.dim} onClick={onClose} data-sheet-dim />
      <div ref={sheet} className={shown ? `${s.sheet} ${s.on}` : s.sheet} role="dialog" aria-modal="true" aria-label={label}
           data-sheet data-lenis-prevent>
        <div className={s.grab} data-grab aria-hidden="true" {...drag}><i /></div>
        <div className={s.head}>
          <h2 className={s.title}>{title}</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="닫기" data-sheet-close>×</button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}
