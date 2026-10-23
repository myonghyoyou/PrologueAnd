'use client';
import { useEffect, useRef } from 'react';
import { Num, ui } from '@/components/ui/controls';
import { PHASES } from '@/content/ownership/rules';
import type { OwnershipCopy } from '@/content/ownership/copy/types';
import s from './step-shell.module.css';

type P = { c: OwnershipCopy; phase: number; qid: string; title: string; onPrev: () => void; onNext: () => void; nextLabel: string; children: React.ReactNode };

/** 질문 한 화면 — 진행 표시(01 / 03 + 묶음 이름), 질문 제목, 선택지, 아래 고정 이전·다음 */
export function StepShell({ c, phase, qid, title, onPrev, onNext, nextLabel, children }: P) {
  const h = useRef<HTMLHeadingElement>(null);
  // 질문이 바뀌면 제목으로 포커스 — 화면 낭독기가 새 질문을 읽는다
  useEffect(() => { h.current?.focus({ preventScroll: true }); }, [qid]);
  const name = c.phases[PHASES[phase]];
  return (
    <section className={s.step} data-own-q={qid}>
      <div className={s.top} data-own-progress aria-live="polite">
        <Num n={phase + 1} className={s.n} /><span className={`${ui.num} ${s.of}`} aria-hidden="true">/ {String(PHASES.length).padStart(2, '0')}</span>
        <span className={s.ph}>{name}</span>
        <span className={s.bar} aria-hidden="true"><b style={{ width: `${((phase + 1) / PHASES.length) * 100}%` }} /></span>
      </div>
      <h1 ref={h} tabIndex={-1} className={s.q}>{title}</h1>
      {children}
      <div className={s.navbar} data-own-bar>
        <div className={s.navrow}>
          <button type="button" className={ui.txt} onClick={onPrev} data-own-prev>{c.nav.prev}</button>
          <button type="button" className={`${ui.btn} ${ui.pri} ${s.next}`} onClick={onNext} data-own-next>{nextLabel}</button>
        </div>
      </div>
    </section>
  );
}
