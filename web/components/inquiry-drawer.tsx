'use client';
import { useEffect, useRef, useState } from 'react';
import { getLenis } from './lenis-provider';
import { TOOLS, PEOPLE, REPEAT, KIND, WHEN, BUDGET } from '@/lib/inquiry-schema';
import { getProject } from '@/content';
import s from './inquiry-drawer.module.css';

type Step = 'step1' | 'step2' | 'done';

const HEADING_ID = 'inquiry-drawer-heading';
const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]';

function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && (el.offsetParent !== null || el === document.activeElement),
  );
}

export function InquiryDrawer() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('step1');
  const [project, setProject] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const openedAt = useRef(0);
  const form = useRef<HTMLFormElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openRef = useRef(false);

  useEffect(() => { openRef.current = open; }, [open]);

  // [data-open-drawer] 클릭으로 열기 — 열려 있던 자리(step)는 그대로 두고, done 이후엔 새로 시작 (form 이 다시 마운트되며 값이 비워진다)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-open-drawer]');
      if (!t) return;
      e.preventDefault();
      opener.current = t;
      setProject(t.dataset.project ?? '');
      setError('');
      setStep((prev) => (prev === 'done' ? 'step1' : prev));
      setOpen(true);
      openedAt.current = Date.now();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Escape로 닫기 + 열려 있는 동안 Tab/Shift+Tab을 서랍 안에 가둔다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !open) return;
      const container = drawer.current;
      if (!container) return;
      const list = focusables(container);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // 열린 동안 배경 스크롤 잠금 (시안 v3.js:130·136)
  useEffect(() => {
    document.documentElement.toggleAttribute('data-drawer-open', open);
    const l = getLenis();
    if (open) { l?.stop(); document.documentElement.style.overflow = 'hidden'; }
    else { l?.start(); document.documentElement.style.overflow = ''; }
    return () => {
      getLenis()?.start();
      document.documentElement.style.overflow = '';
      document.documentElement.removeAttribute('data-drawer-open');
    };
  }, [open]);

  // 열릴 때 현재 단계(보이는 필드)의 첫 포커스 가능한 요소로 포커스, 닫힐 때 연 버튼으로 되돌리기 (시안 v3.js:131)
  // step 이 close/reopen 사이에 그대로 유지되므로, DOM 순서상 첫 textarea(1단계 work)가 아니라
  // "지금 보이는" 필드를 찾아야 한다 — 안 그러면 2단계에서 닫았다 다시 열 때 포커스가 숨은(.off) 요소를 겨냥해 아무 데도 못 가고,
  // 서랍 밖(연 버튼)에 남아 Tab 트랩의 first/last 판정이 성립하지 않아 Tab이 배경으로 새어나간다.
  useEffect(() => {
    if (!open) { opener.current?.focus(); return; }
    const timer = setTimeout(() => {
      const scoped = form.current ? focusables(form.current) : [];
      const target = scoped[0] ?? (drawer.current ? focusables(drawer.current)[0] : undefined);
      target?.focus();
    }, 380);
    return () => clearTimeout(timer);
  }, [open]);

  const read = () => {
    const fd = new FormData(form.current!);
    return {
      work: String(fd.get('work') ?? ''),
      tools: fd.getAll('tools').map(String),
      pain: String(fd.get('pain') ?? ''),
      people: String(fd.get('people') ?? '') || undefined,
      repeat: String(fd.get('repeat') ?? '') || undefined,
      kind: String(fd.get('kind') ?? '') || undefined,
      goal: String(fd.get('goal') ?? ''),
      when: String(fd.get('when') ?? '') || undefined,
      budget: String(fd.get('budget') ?? '') || undefined,
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      hp_note: String(fd.get('hp_note') ?? ''),
      project,
      elapsed: Date.now() - openedAt.current,
    };
  };

  const next = () => {
    const v = read();
    if (v.pain.trim().length < 2) { setError('가장 불편한 점을 한 줄만 적어주세요.'); return; }
    setError('');
    setStep('step2');
    if (form.current) form.current.scrollTop = 0; // 시안 v3.js:108
  };

  const prev = () => {
    setStep('step1');
    if (form.current) form.current.scrollTop = 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = read();
    if (v.pain.trim().length < 2) {
      setError('가장 불편한 점을 한 줄만 적어주세요.');
      setStep('step1');
      if (form.current) form.current.scrollTop = 0;
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) { setError('연락받을 메일 주소를 적어주세요.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(v),
      });
      const json = await res.json();
      if (!openRef.current) return; // 보내는 동안 서랍이 닫혔으면 늦게 온 응답은 무시 — 다시 열거나 스크롤을 잠그지 않는다
      if (json.ok) setStep('done');
      else setError(json.error ?? '보내지 못했습니다.');
    } catch {
      if (openRef.current) setError('보내지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

  const step1 = step === 'step1';
  const who = getProject(project)?.title || '문의';

  return (
    <>
      <div className={open ? `${s.backdrop} ${s.backdropOn}` : s.backdrop} onClick={() => setOpen(false)} />
      <aside
        ref={drawer}
        className={open ? `${s.drawer} ${s.drawerOn}` : s.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={HEADING_ID}
        aria-hidden={open ? undefined : true}
        inert={!open}
        data-drawer
      >
        <div className={s.head}>
          <span id={HEADING_ID} className={s.brand}>Prologue<span className={s.amp}>&amp;</span>
            <span className={s.who}>{who}</span></span>
          <button type="button" className={s.close} onClick={() => setOpen(false)} aria-label="닫기">×</button>
        </div>

        {step === 'done' ? (
          <div className={s.body} data-lenis-prevent>
            <div className={s.done}>
              <span className={s.doneAmp} aria-hidden="true">&amp;</span>
              <div className={s.h2}>여기서부터 함께합니다</div>
              <p>잘 받았습니다. 이틀 안에 답장드리겠습니다.</p>
            </div>
          </div>
        ) : (
          <form ref={form} className={s.body} data-lenis-prevent onSubmit={submit} noValidate>
            <div className={step1 ? s.on : s.off}>
              <span className={s.num}>1 / 2</span><div className={s.h2}>지금 하는 일</div>
              <label className={s.fld}>어떤 일을 하고 계세요?<textarea name="work" rows={3} placeholder="예) 병동마다 비품 요청을 카톡이랑 엑셀로 받고 있어요" /></label>
              <fieldset className={s.fld}><legend>지금 쓰는 것</legend>
                <div className={s.chips}>{TOOLS.map((t) => (
                  <label key={t}><input type="checkbox" name="tools" value={t} /><span>{t}</span></label>
                ))}</div>
              </fieldset>
              <label className={s.fld}>무엇이 가장 불편하세요? <b>*</b><textarea name="pain" rows={3} placeholder="한 줄이면 됩니다" /></label>
              <div className={s.grid}>
                <label>쓰는 사람<select name="people" defaultValue=""><option value="">고르지 않음</option>{PEOPLE.map((o) => <option key={o}>{o}</option>)}</select></label>
                <label>얼마나 자주<select name="repeat" defaultValue=""><option value="">고르지 않음</option>{REPEAT.map((o) => <option key={o}>{o}</option>)}</select></label>
                <label>고치기 / 새로 만들기<select name="kind" defaultValue=""><option value="">고르지 않음</option>{KIND.map((o) => <option key={o}>{o}</option>)}</select></label>
              </div>
            </div>

            <div className={step1 ? s.off : s.on}>
              <span className={s.num}>2 / 2</span><div className={s.h2}>바라는 것과 연락처</div>
              <label className={s.fld}>이렇게 됐으면 (선택)<textarea name="goal" rows={3} placeholder="예) 요청이 한 곳으로 모이고, 진행 상황을 서로 물어보지 않아도 되게" /></label>
              <div className={s.grid2}>
                <label>언제까지<select name="when" defaultValue=""><option value="">고르지 않음</option>{WHEN.map((o) => <option key={o}>{o}</option>)}</select></label>
                <label>예산<select name="budget" defaultValue=""><option value="">고르지 않음</option>{BUDGET.map((o) => <option key={o}>{o}</option>)}</select></label>
              </div>
              <label className={s.fld}>이메일 <b>*</b><input name="email" type="email" placeholder="name@company.com" /></label>
              <label className={s.fld}>전화 (선택)<input name="phone" type="tel" placeholder="010-" /></label>
              <input name="hp_note" type="text" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden="true" />
            </div>

            {error ? (
              <p className={s.error} role="alert">{error}{' '}
                <a href="mailto:PrologueAnd@gmail.com">PrologueAnd@gmail.com</a>으로 바로 보내셔도 됩니다.</p>
            ) : null}

            <div className={s.foot}>
              {step1 ? null : <button type="button" onClick={prev}>이전</button>}
              {step1
                ? <button type="button" className={s.send} onClick={next}>다음</button>
                : <button type="submit" className={s.send} disabled={sending}>{sending ? '보내는 중' : '보내기'}</button>}
            </div>
          </form>
        )}
      </aside>
    </>
  );
}
