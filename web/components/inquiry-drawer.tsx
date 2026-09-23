'use client';
import { useEffect, useRef, useState } from 'react';
import { getLenis } from './lenis-provider';
import { TOOLS, PEOPLE, REPEAT, KIND, WHEN, BUDGET } from '@/lib/inquiry-schema';
import s from './inquiry-drawer.module.css';

type State = 'closed' | 'step1' | 'step2' | 'done';

export function InquiryDrawer() {
  const [state, setState] = useState<State>('closed');
  const [project, setProject] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const openedAt = useRef(0);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-open-drawer]');
      if (!t) return;
      e.preventDefault();
      setProject(t.dataset.project ?? '');
      setError(''); setState('step1');
      openedAt.current = Date.now();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setState('closed'); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  // 열린 동안 배경 스크롤 잠금 (시안 v3.js:130·136)
  useEffect(() => {
    const open = state !== 'closed';
    document.documentElement.toggleAttribute('data-drawer-open', open);
    const l = getLenis();
    if (open) { l?.stop(); document.documentElement.style.overflow = 'hidden'; }
    else { l?.start(); document.documentElement.style.overflow = ''; }
    return () => { getLenis()?.start(); document.documentElement.style.overflow = ''; };
  }, [state]);

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
      website: String(fd.get('website') ?? ''),
      project,
      elapsed: Date.now() - openedAt.current,
    };
  };

  const next = () => {
    const v = read();
    if (v.pain.trim().length < 2) { setError('가장 불편한 점을 한 줄만 적어주세요.'); return; }
    setError(''); setState('step2');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = read();
    if (v.pain.trim().length < 2) { setError('가장 불편한 점을 한 줄만 적어주세요.'); setState('step1'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) { setError('연락받을 메일 주소를 적어주세요.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(v),
      });
      const json = await res.json();
      if (json.ok) setState('done');
      else setError(json.error ?? '보내지 못했습니다.');
    } catch {
      setError('보내지 못했습니다.');
    } finally { setSending(false); }
  };

  if (state === 'closed') return null;
  const step1 = state === 'step1';

  return (
    <>
      <div className={s.backdrop} onClick={() => setState('closed')} />
      <aside className={s.drawer} aria-label="프로젝트 문의" data-drawer>
        <div className={s.head}>
          <span className={s.brand}>Prologue<span className={s.amp}>&amp;</span>
            <span className={s.who}>{project || '문의'}</span></span>
          <button type="button" className={s.close} onClick={() => setState('closed')} aria-label="닫기">×</button>
        </div>

        {state === 'done' ? (
          <div className={s.body} data-lenis-prevent>
            <div className={s.h2}>여기서부터 함께합니다</div>
            <p>잘 받았습니다. 이틀 안에 답장드리겠습니다.</p>
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
              <label className={s.fld}>이렇게 됐으면 (선택)<textarea name="goal" rows={3} /></label>
              <div className={s.grid2}>
                <label>언제까지<select name="when" defaultValue=""><option value="">고르지 않음</option>{WHEN.map((o) => <option key={o}>{o}</option>)}</select></label>
                <label>예산<select name="budget" defaultValue=""><option value="">고르지 않음</option>{BUDGET.map((o) => <option key={o}>{o}</option>)}</select></label>
              </div>
              <label className={s.fld}>이메일 <b>*</b><input name="email" type="email" placeholder="name@company.com" /></label>
              <label className={s.fld}>전화 (선택)<input name="phone" type="tel" placeholder="010-" /></label>
              <input name="website" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden="true" />
            </div>

            {error ? (
              <p className={s.error} role="alert">{error}{' '}
                <a href="mailto:PrologueAnd@gmail.com">PrologueAnd@gmail.com</a>으로 바로 보내셔도 됩니다.</p>
            ) : null}

            <div className={s.foot}>
              {step1 ? null : <button type="button" onClick={() => setState('step1')}>이전</button>}
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
