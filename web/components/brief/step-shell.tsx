'use client';
import { useEffect, useRef } from 'react';
import { Q } from '@/content/brief/questions';
import { PHASES } from '@/lib/brief/steps';
import s from './step-shell.module.css';

type P = { phase: number; onPreview?: () => void; title: string; help?: string; error?: string; onPrev?: () => void; onNext: () => void; onStepNext?: () => void; nextLabel: string; dunno?: { label: string; onClick: () => void }; children: React.ReactNode };

export function StepShell({ phase, onPreview, title, help, error, onPrev, onNext, onStepNext, nextLabel, dunno, children }: P) {
  const h = useRef<HTMLHeadingElement>(null);
  // 단계가 바뀌면 제목으로 포커스 — 화면 낭독기가 새 질문을 읽는다
  useEffect(() => { h.current?.focus({ preventScroll: true }); }, [title]);
  return (
    <section className={s.step} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); onNext(); } }}>
      <div className={s.top} data-brief-progress aria-live="polite">
        {/* 분기로 단계 수가 바뀌므로 숫자 대신 네 묶음(명세 §11) */}
        <span>{PHASES[phase].name} · {PHASES.length}단계 중 {phase + 1}단계</span>
        <div className={s.bar} aria-hidden="true">{PHASES.map((p, i) => <i key={p.name} data-seg className={i <= phase ? s.segOn : ''} />)}</div>
        {onPreview ? <button type="button" className={s.pv} onClick={onPreview} data-brief-preview-open>요청서 미리보기</button> : null}
      </div>
      <h1 ref={h} tabIndex={-1} className={s.q}>{title}</h1>
      {help ? <p className={s.help}>{help}</p> : null}
      {children}
      {dunno ? <button type="button" className={s.dunno} onClick={dunno.onClick}>{dunno.label}</button> : null}
      {error ? <p className={s.error} role="alert" data-brief-error>{error}</p> : null}
      <div className={s.navbar} data-brief-bar>
        <div className={s.navin}><div className={s.navrow}>
          {onPrev ? <button type="button" className={s.btn} onClick={onPrev} data-brief-prev>이전</button> : <span />}
          <span className={s.right}>
            {/* 결과에서 단원 고치기로 들어왔을 때 — 그 뒤 질문도 이어서 고칠 수 있게 */}
            {onStepNext ? <button type="button" className={s.btn} onClick={onStepNext} data-brief-step-next>다음 질문</button> : null}
            <button type="button" className={`${s.btn} ${s.pri}`} onClick={onNext} data-brief-next>{nextLabel}</button>
          </span>
        </div></div>
      </div>
    </section>
  );
}
export { Q };
