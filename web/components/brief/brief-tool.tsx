'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLenis } from '@/components/lenis-provider';
import { Q } from '@/content/brief/questions';
import { REQUIRED, isAnswered, visibleSteps } from '@/lib/brief/steps';
import { browserStorage, clearBrief, emptyAnswers, loadSaved, saveSaved, storageOk } from '@/lib/brief/storage';
import type { Answers, StepId } from '@/lib/brief/types';
import { StepShell } from './step-shell';
import { STEP_HELP, STEP_TITLE, StepView } from './steps';
import { Result } from './result';

const top = () => { const l = getLenis(); if (l) l.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); };

export function BriefTool() {
  const [a, setA] = useState<Answers>(emptyAnswers);
  const [step, setStep] = useState<StepId>('mode');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [noStore, setNoStore] = useState(false);
  const [back, setBack] = useState(false);          // 결과에서 「고치기」로 들어왔는지

  useEffect(() => {
    const s = browserStorage();
    setNoStore(!storageOk(s));
    const v = loadSaved(s);
    if (v) { setA(v.answers); setStep(v.step); setDone(v.done); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) saveSaved(browserStorage(), { answers: a, step, done }); }, [a, step, done, ready]);

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
  const reset = () => { clearBrief(browserStorage()); setA(emptyAnswers()); setStep('mode'); setDone(false); setBack(false); top(); };

  const dunno = step === 'features'
    ? { label: Q.features.unknown, onClick: () => { set({ features: {}, featuresUnknown: true }); next(); } }
    : step === 'design' || step === 'pages' || step === 'brand' || step === 'links' || step === 'ops'
      ? { label: Q.dunno, onClick: () => next() } : undefined;

  if (!ready) return <div data-brief aria-busy="true" />;
  return (
    <div data-brief>
      {noStore ? <p data-brief-nostore style={{ fontSize: 13, color: 'var(--warning)', margin: '0 0 16px' }}>이 브라우저에서는 저장이 안 돼서 새로고침하면 답이 사라져요.</p> : null}
      {done
        ? <Result a={a} onEdit={edit} onReset={reset} />
        : <StepShell index={idx} total={steps.length} title={STEP_TITLE[step]} help={STEP_HELP[step]} error={error}
            onPrev={prev} onNext={next} nextLabel={back ? '결과로 돌아가기' : idx === steps.length - 1 ? '요청서 만들기' : '다음'} dunno={dunno}>
            <StepView id={step} a={a} set={set} />
          </StepShell>}
    </div>
  );
}
