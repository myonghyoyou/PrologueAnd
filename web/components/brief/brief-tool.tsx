'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLenis } from '@/components/lenis-provider';
import { Q } from '@/content/brief/questions';
import { REQUIRED, isAnswered, phaseOf, visibleSteps } from '@/lib/brief/steps';
import { browserStorage, clearBrief, emptyAnswers, loadSaved, saveSaved, storageOk } from '@/lib/brief/storage';
import { UNKNOWN, type Answers, type StepId } from '@/lib/brief/types';
import { StepShell } from './step-shell';
import { STEP_HELP, STEP_TITLE, StepView } from './steps';
import { Result } from './result';
import { Intro } from './intro';
import { BriefPreview } from './preview';
import { BottomSheet } from '@/components/bottom-sheet';
import s from './brief-tool.module.css';

/** 모르겠어요를 누르면 그 단계에서 골라 둔 답을 지운다 — 남아 있으면 요청서에 고른 답처럼 나간다 */
const DUNNO_CLEAR: Partial<Record<StepId, Partial<Answers>>> = {
  pages: { pages: [], pagesExtra: '' }, design: { design: UNKNOWN }, brand: { brand: [] }, links: { links: [] }, ops: { ops: [] },
};

const top = () => { const l = getLenis(); if (l) l.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); };

export function BriefTool() {
  const [a, setA] = useState<Answers>(emptyAnswers);
  const [step, setStep] = useState<StepId>('mode');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [noStore, setNoStore] = useState(false);
  const [back, setBack] = useState(false);          // 결과에서 「고치기」로 들어왔는지
  const [started, setStarted] = useState(false);    // 시작 화면을 지났는지 — 저장된 답이 있으면 지난 것
  const [sheet, setSheet] = useState(false);        // 좁은 화면의 요청서 미리보기 시트

  useEffect(() => {
    const s = browserStorage();
    setNoStore(!storageOk(s));
    const v = loadSaved(s);
    if (v) { setA(v.answers); setStep(v.step); setDone(v.done); setStarted(true); }
    setReady(true);
  }, []);
  // 시작하기 전에는 저장하지 않는다 — 저장된 답이 있다는 것이 곧 시작했다는 뜻
  useEffect(() => { if (ready && started) saveSaved(browserStorage(), { answers: a, step, done }); }, [a, step, done, ready, started]);

  const steps = useMemo(() => visibleSteps(a), [a]);
  const idx = Math.max(0, steps.indexOf(step));
  const set = useCallback((p: Partial<Answers>) => { setA((o) => ({ ...o, ...p })); setError(''); }, []);

  const go = (s: StepId) => { setStep(s); setError(''); top(); };
  const next = () => {
    if (REQUIRED.includes(step) && !isAnswered(a, step)) { setError(Q.required); return; }
    if (back || idx === steps.length - 1) { setDone(true); setBack(false); top(); return; }
    go(steps[idx + 1]);
  };
  const prev = idx > 0 ? () => go(steps[idx - 1]) : undefined;
  // 단원의 「고치기」는 그 질문만 고치고 결과로. 「답 고치기」(mode)는 처음부터 다시 걷는다 — 고치기↔새로 만들기를 바꾸면 단계가 달라지므로
  const edit = (s: StepId) => { setDone(false); setBack(s !== 'mode'); go(s); };
  const reset = () => { clearBrief(browserStorage()); setStarted(false); setA(emptyAnswers()); setStep('mode'); setDone(false); setBack(false); top(); };
  const start = () => { setStarted(true); setStep('mode'); top(); };

  const dunno = step === 'features'
    ? { label: Q.features.unknown, onClick: () => { set({ features: {}, featuresUnknown: true }); next(); } }
    : DUNNO_CLEAR[step]
      ? { label: Q.dunno, onClick: () => { set(DUNNO_CLEAR[step]!); next(); } } : undefined;

  if (!ready) return <div data-brief aria-busy="true" />;
  return (
    <div data-brief>
      {noStore ? <p className={s.nostore} data-brief-nostore>이 브라우저에서는 저장이 안 돼서 새로고침하면 답이 사라져요.</p> : null}
      {!started
        ? <div className={s.single}><Intro onStart={start} /></div>
        : done
        ? <div className={s.single}><Result a={a} onEdit={edit} onReset={reset} /></div>
        : <div className={s.two}><div className={s.main}><StepShell phase={phaseOf(step)} onPreview={() => setSheet(true)} title={STEP_TITLE[step]} help={STEP_HELP[step]} error={error}
            onPrev={prev} onNext={next} onStepNext={back && idx < steps.length - 1 ? () => go(steps[idx + 1]) : undefined} nextLabel={back ? '결과로 돌아가기' : idx === steps.length - 1 ? '요청서 만들기' : '다음'} dunno={dunno}>
            <StepView id={step} a={a} set={set} />
          </StepShell></div>
          {/* 넓은 화면: 답이 요청서가 되어 가는 모습을 옆에 둔다(명세 §11 2차) */}
          <aside className={s.aside} data-brief-preview data-lenis-prevent aria-label="요청서 미리보기"><BriefPreview a={a} current={step} /></aside>
          <BottomSheet open={sheet} onClose={() => setSheet(false)} title="요청서 미리보기" label="요청서 미리보기"><BriefPreview a={a} current={step} /></BottomSheet>
        </div>}
    </div>
  );
}
