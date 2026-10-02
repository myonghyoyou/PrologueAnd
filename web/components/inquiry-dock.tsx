'use client';
import { useEffect, useState } from 'react';
import s from './inquiry-dock.module.css';

/** 3C 하단 문의 바(폰) — 사례는 표지를 지나면, 목록은 처음부터. 끝 문의 영역·바닥글이 보이면 숨는다.
 *  누르면 0.38s 동안 시트 자리까지 커진 뒤 서랍(폰 시트)이 그 자리에 바로 열린다(계획 §0-2) */
export function InquiryDock({ project = '', mode }: { project?: string; mode: 'case' | 'list' }) {
  const [on, setOn] = useState(false);
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    const phone = window.matchMedia('(max-width:1023px)');
    const f = () => {
      if (!phone.matches) return setOn(false);
      let show = true;
      if (mode === 'case') { const c = document.querySelector('[data-cover]'); show = !!c && c.getBoundingClientRect().bottom < 0; }
      const end = document.querySelector('[data-closing], footer');
      if (end && end.getBoundingClientRect().top < window.innerHeight - 40) show = false;
      setOn(show);
    };
    window.addEventListener('scroll', f, { passive: true });
    window.addEventListener('resize', f);
    phone.addEventListener('change', f);
    f();
    return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f); phone.removeEventListener('change', f); };
  }, [mode]);

  const open = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    setGrow(true);
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('inquiry:open', { detail: { project, instant: true } }));
      setGrow(false);
    }, reduced ? 0 : 380);
  };

  return (
    <button type="button" className={s.dock} onClick={open} data-dock data-on={on ? '' : undefined} data-grow={grow ? '' : undefined}
            aria-hidden={on ? undefined : true} tabIndex={on ? 0 : -1}>
      <span>비슷한 문제가 있다면</span><b>문의하기 ▴</b>
    </button>
  );
}
