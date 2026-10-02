'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getLenis } from './lenis-provider';
import { useBackClose } from '@/lib/use-back-close';
import { useDragClose } from '@/lib/use-drag-close';
import { NEED, PEOPLE, WHEN, BUDGET } from '@/lib/inquiry-schema';
import { Select } from './select';
import { getProject } from '@/content';
import s from './inquiry-drawer.module.css';
import { CONTACT_MAIL } from '@/lib/contact';

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
  const [mounted, setMounted] = useState(false);   // 다 닫히면 hidden(모바일 명세 §7)
  const [instant, setInstant] = useState(false);   // 문의 바에서 열면 미끄러짐 없이 그 자리에
  const [phone, setPhone] = useState(false);
  const drag = useDragClose(drawer, () => setOpen(false));
  useBackClose(open, () => setOpen(false), phone);

  useEffect(() => { openRef.current = open; }, [open]);

  // [data-open-drawer] 클릭 · inquiry:open 이벤트(폰 문의 바)로 열기 — 열려 있던 자리(step)는 그대로 두고, done 이후엔 새로 시작 (form 이 다시 마운트되며 값이 비워진다)
  const openWith = useCallback((p: string, from: HTMLElement | null, inst: boolean) => {
    opener.current = from;
    setProject(p); setError('');
    setStep((prev) => (prev === 'done' ? 'step1' : prev));
    setPhone(window.matchMedia('(max-width:1023px)').matches);
    setInstant(inst);
    // 붙이기와 열기를 한 번에 — 숨김(display:none)에서 나타날 때의 미끄러짐은 CSS @starting-style 이 맡는다
    setMounted(true);
    setOpen(true);
    openedAt.current = Date.now();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-open-drawer]');
      if (!t) return;
      e.preventDefault();
      openWith(t.dataset.project ?? '', t, false);
    };
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ project: string; instant?: boolean }>).detail;
      openWith(d.project, document.querySelector<HTMLElement>('[data-dock]'), !!d.instant);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('inquiry:open', onOpen);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('inquiry:open', onOpen); };
  }, [openWith]);

  // 다 닫히면(미끄러짐 0.35s 뒤) hidden, 다음 열기는 다시 미끄러진다
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => { setMounted(false); setInstant(false); }, 360);
    return () => clearTimeout(t);
  }, [open]);

  // 폰 키보드: 가려지는 높이만큼 시트를 올린다
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !phone || !vv) return;
    const f = () => document.documentElement.style.setProperty('--kb', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
    f(); vv.addEventListener('resize', f); vv.addEventListener('scroll', f);
    return () => { vv.removeEventListener('resize', f); vv.removeEventListener('scroll', f); document.documentElement.style.removeProperty('--kb'); };
  }, [open, phone]);

  // Escape로 닫기 + 열려 있는 동안 Tab/Shift+Tab을 서랍 안에 가둔다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (!e.defaultPrevented) setOpen(false); return; }   // 고르기 칸 목록의 Esc 는 목록만 닫는다(select.tsx)
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
      need: String(fd.get('need') ?? '') || undefined,
      pain: String(fd.get('pain') ?? ''),
      people: String(fd.get('people') ?? '') || undefined,
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
    if (v.pain.trim().length < 2) { setError('지금 상황을 한두 줄로 적어주세요.'); return; }
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
      setError('지금 상황을 한두 줄로 적어주세요.');
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
      <div className={open ? `${s.backdrop} ${s.backdropOn}` : s.backdrop} hidden={!mounted} onClick={() => setOpen(false)} />
      <aside
        ref={drawer}
        className={`${s.drawer} ${open ? s.drawerOn : ''} ${instant ? s.instant : ''}`}
        hidden={!mounted}
        role="dialog"
        aria-modal="true"
        aria-labelledby={HEADING_ID}
        aria-hidden={open ? undefined : true}
        inert={!open}
        data-drawer
        data-lenis-prevent
      >
        <div className={s.grab} data-drawer-grab aria-hidden="true" {...drag}><i /></div>
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
              <span className={s.num}>1 / 2</span><div className={s.h2}>어떤 일인가요</div>
              <fieldset className={s.fld}><legend>무엇이 필요하세요?</legend>
                <div className={s.need}>{NEED.map((o) => (
                  <label key={o}><input type="radio" name="need" value={o} /><span>{o}</span></label>
                ))}</div>
              </fieldset>
              <label className={s.fld}>지금 상황 <b>*</b><textarea name="pain" rows={4} placeholder="한두 줄이면 됩니다. 예) 병동마다 비품 요청을 카톡이랑 엑셀로 받고 있어요" /></label>
              <div className={s.fld}><Select name="people" label="누가 쓰나요" options={PEOPLE} /></div>
            </div>

            <div className={step1 ? s.off : s.on}>
              <span className={s.num}>2 / 2</span><div className={s.h2}>바라는 것과 연락처</div>
              <label className={s.fld}>이렇게 됐으면 (선택)<textarea name="goal" rows={3} placeholder="예) 요청이 한 곳으로 모이고, 진행 상황을 서로 물어보지 않아도 되게" /></label>
              <div className={s.grid2}>
                <Select name="when" label="언제까지" options={WHEN} />
                <Select name="budget" label="예산" options={BUDGET} />
              </div>
              <label className={s.fld}>이메일 <b>*</b><input name="email" type="email" placeholder="name@company.com" /></label>
              <label className={s.fld}>전화 (선택)<input name="phone" type="tel" placeholder="010-" /></label>
              <input name="hp_note" type="text" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden="true" />
            </div>

            {error ? (
              <p className={s.error} role="alert">{error}{' '}
                <a href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a>으로 바로 보내셔도 됩니다.</p>
            ) : null}

            <div className={s.foot}>
              {step1 ? null : <button type="button" onClick={prev}>이전</button>}
              {/* key 를 달리해 다른 요소로 그린다 — 같은 요소를 재사용하면 "다음" 클릭 중에 type 이 submit 으로 바뀌어 곧바로 제출된다 */}
              {step1
                ? <button key="next" type="button" className={s.send} onClick={next}>다음</button>
                : <button key="send" type="submit" className={s.send} disabled={sending}>{sending ? '보내는 중' : '보내기'}</button>}
            </div>
          </form>
        )}
      </aside>
    </>
  );
}
