'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getLenis } from '@/components/lenis-provider';
import { ChoiceRow, ui } from '@/components/ui/controls';
import { QUESTIONS } from '@/content/ownership/rules';
import { copyFor } from '@/content/ownership/copy';
import type { Answers, Facts, Locale, Lookup, OptId, QId } from '@/lib/ownership/types';
import { normalizeInput } from '@/lib/ownership/normalize';
import { lookupAll } from '@/lib/ownership/lookup';
import { interpret } from '@/lib/ownership/interpret';
import { fill, items, providerName, visibleQuestions } from '@/lib/ownership/verdict';
import { clearOwnership, loadOwnership, ownershipStorage, ownershipStorageOk, saveOwnership } from '@/lib/ownership/storage';
import { DomainStep } from './domain-step';
import { LookupPanel } from './lookup-panel';
import { StepShell } from './step-shell';
import { Result } from './result';
import { Sheet } from './sheet';
import s from './ownership.module.css';

/** step: 'domain'(입력) · 'lookup'(조회 결과) · 'q:<질문>' · 'result' */
type Step = 'domain' | 'lookup' | `q:${QId}` | 'result';

const top = () => { const l = getLenis(); if (l) l.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); };

/** 질문 제목의 {r}(회사 이름)·{n}(등록인) — 이름을 모르면 이름 없는 문구 */
function questionTitle(id: QId, f: Facts, locale: Locale): string {
  const q = copyFor(locale).q[id];
  const r = id === 'registrarLogin' ? providerName(f.registrar, locale) ?? f.registrarRaw
    : id === 'dnsLogin' ? (f.nsDiffers === 'yes' ? providerName(f.nsProvider, locale) : null)
    : id === 'hostLogin' || id === 'builderAccount' ? providerName(f.host, locale)
    : id === 'mailAdmin' ? (f.mail && typeof f.mail === 'object' ? providerName(f.mail, locale) : null)
    : null;
  if (id === 'registrantIsMe') return fill(q.title, { n: f.registrant ?? '' });
  return r ? fill(q.title, { r }) : q.titleNoName ?? q.title;
}

export function OwnershipTool({ locale }: { locale: Locale }) {
  const c = copyFor(locale);
  const [input, setInput] = useState('');
  const [domainOf, setDomainOf] = useState('');        // 조회한 입력(바꿔 적는 중인 input 과 따로)
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState<Step>('domain');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [noStore, setNoStore] = useState(false);
  const [ready, setReady] = useState(false);
  const seq = useRef(0);                                // 늦게 온 옛 조회 결과를 버리는 번호
  const now = useMemo(() => new Date(), [lookup, step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const st = ownershipStorage();
    setNoStore(!ownershipStorageOk(st));
    const v = loadOwnership(st);
    if (v) { setInput(v.input); setDomainOf(v.input); setLookup(v.lookup); setAnswers(v.answers); setStep(v.step as Step); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const st = ownershipStorage();
    // 아무것도 조회하지 않은 상태는 남기지 않는다(모두 지우기 뒤 빈 기록이 다시 생기지 않게)
    if (!domainOf) { clearOwnership(st); return; }
    saveOwnership(st, { v: 1, input: domainOf, lookup, answers, step, done: step === 'result' });
  }, [ready, domainOf, lookup, answers, step]);

  const n = useMemo(() => { const r = normalizeInput(domainOf); return r.ok ? r : null; }, [domainOf]);
  const facts = useMemo(() => (n ? interpret(n, lookup, now) : null), [n, lookup, now]);
  const qs = useMemo(() => (facts ? visibleQuestions(facts) : []), [facts]);

  const go = (to: Step) => { setStep(to); top(); };

  const runLookup = async (raw: string) => {
    const r = normalizeInput(raw);
    if (!r.ok) { setError(r.error === 'empty' ? c.errors.empty : c.errors.shape); return; }
    setError('');
    const my = ++seq.current;
    if (r.builderOnly) { setDomainOf(raw); setLookup(null); go('lookup'); return; }
    setBusy(true);
    const l = await lookupAll(r.domain);
    if (my !== seq.current) return;                     // 그사이 다른 주소로 다시 조회했다
    setBusy(false);
    if (l.rdap.status === 'notFound') { setLookup(null); setStep('domain'); setError(c.errors.notFound); return; }
    setDomainOf(raw); setLookup(l); go('lookup');
  };

  if (!ready) return <div className={s.root} data-own />;
  const langHref = locale === 'ko' ? '/en/tools/ownership' : '/tools/ownership';
  const nostore = noStore ? <p className={s.nostore} data-own-nostore>{c.nav.noStore}</p> : null;

  if (step.startsWith('q:') && facts) {
    const id = step.slice(2) as QId;
    const at = qs.indexOf(id);
    if (at < 0) { queueMicrotask(() => setStep(qs[0] ? `q:${qs[0]}` : 'result')); return <div className={s.root} data-own />; }
    const q = QUESTIONS.find((x) => x.id === id)!;
    const next = () => go(at + 1 < qs.length ? `q:${qs[at + 1]}` : 'result');
    const prev = () => go(at > 0 ? `q:${qs[at - 1]}` : 'lookup');
    const name = `own-${id}`;
    return (
      <div className={s.root} data-own>
        {nostore}
        <StepShell c={c} phase={q.phase} qid={id} title={questionTitle(id, facts, locale)} onPrev={prev} onNext={next} nextLabel={at + 1 < qs.length ? c.nav.next : c.nav.toResult}>
          <div className={ui.rows} role="radiogroup">
            {q.opts.map((o: OptId) => (
              <ChoiceRow key={o} type="radio" name={name} value={o} checked={answers[id] === o} onChange={() => setAnswers((a) => ({ ...a, [id]: o }))}>{c.q[id].opts[o]}</ChoiceRow>
            ))}
          </div>
        </StepShell>
      </div>
    );
  }

  if (step === 'result' && facts && n) {
    const list = items(facts, answers);
    return (
      <div className={s.root} data-own>
        {nostore}
        <Result c={c} locale={locale} domain={n.display} facts={facts} list={list}
          onEdit={() => go(qs[0] ? `q:${qs[0]}` : 'lookup')}
          onReset={() => {
            if (!window.confirm(c.nav.resetConfirm)) return;
            clearOwnership(ownershipStorage()); seq.current++;
            setInput(''); setDomainOf(''); setLookup(null); setAnswers({}); setError(''); go('domain');
          }}
          sheet={<Sheet c={c} locale={locale} facts={facts} domain={n.display} />} />
      </div>
    );
  }

  return (
    <div className={s.root} data-own>
      {nostore}
      <DomainStep c={c} value={input} onChange={setInput} onSubmit={() => runLookup(input)} busy={busy} error={error} langHref={langHref} />
      {step === 'lookup' && facts && n ? (
        <LookupPanel c={c} locale={locale} display={n.display} trimmedFrom={n.trimmedFrom} lookup={lookup} facts={facts} now={now}
          onRetry={() => runLookup(domainOf)} onNext={() => go(qs[0] ? `q:${qs[0]}` : 'result')} />
      ) : null}
    </div>
  );
}
