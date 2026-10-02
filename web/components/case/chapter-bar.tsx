'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getLenis } from '../lenis-provider';
import { BottomSheet } from '../bottom-sheet';
import s from './chapter-bar.module.css';

const pad = (n: number) => String(n).padStart(2, '0');
/** 1A 장 진행 바(폰) — 표지를 지나 아래로 내리면 헤더 자리에 붙고, 위로 올리면 헤더가 돌아온다(명세 §3-1).
 *  방향은 4px 넘게 움직였을 때만 바꾼다 — 손가락 떨림에 깜빡이지 않게 */
export function ChapterBar({ chapters }: { chapters: { id: string; name: string }[] }) {
  const [on, setOn] = useState(false);
  const [cur, setCur] = useState(0);
  const [prog, setProg] = useState(0);
  const [list, setList] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const html = document.documentElement;
    const phone = window.matchMedia('(max-width:1023px)');
    last.current = window.scrollY;
    const onScroll = () => {
      if (!phone.matches) { setOn(false); html.removeAttribute('data-hdr-hide'); return; }
      const y = window.scrollY;
      const cover = document.querySelector('[data-cover]');
      const end = cover ? cover.getBoundingClientRect().bottom + y : 0;
      if (y < end - 64) { setOn(false); html.removeAttribute('data-hdr-hide'); last.current = y; }
      else if (Math.abs(y - last.current) > 4) {
        const show = y > last.current;
        setOn(show); html.toggleAttribute('data-hdr-hide', show); last.current = y;
      }
      const line = window.innerHeight * 0.3;
      let k = 0;
      chapters.forEach((c, i) => { const el = document.getElementById(c.id); if (el && el.getBoundingClientRect().top <= line) k = i; });
      setCur(k);
      const max = html.scrollHeight - window.innerHeight;
      setProg(max > 0 ? Math.min(1, y / max) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    phone.addEventListener('change', onScroll);
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); phone.removeEventListener('change', onScroll); html.removeAttribute('data-hdr-hide'); };
  }, [chapters]);

  const close = useCallback(() => setList(false), []);
  const go = (id: string) => {
    setList(false);
    const el = document.getElementById(id);
    if (!el) return;
    // 시트가 닫히며 뒤로가기 칸을 되돌린 뒤에 옮긴다(되돌림이 스크롤을 덮지 않게)
    setTimeout(() => {
      // 목표는 실제 문서 위치로 계산한다 — Lenis 의 요소 목표는 자기 스크롤 값(손가락 스크롤 뒤 늦을 수 있다)을 써서 어긋난다
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      const l = getLenis();
      // 폰 Lenis 의 lerp(0.075)는 긴 거리에서 2초 넘게 끌린다 — 이동은 0.8초 감속으로 끝낸다
      if (l) l.scrollTo(top, { duration: 0.8, easing: (t) => 1 - Math.pow(1 - t, 3) });
      else window.scrollTo({ top, behavior: 'smooth' });
    }, 340);
  };

  return (
    <>
      <div className={s.bar} data-chapter-bar data-on={on ? '' : undefined} aria-hidden={on ? undefined : true} inert={!on}>
        <button type="button" className={s.btn} onClick={() => setList(true)} aria-haspopup="dialog" data-chapter-toc>
          <b data-chapter-num>{pad(cur + 1)} / {pad(chapters.length)}</b>
          <span data-chapter-name>{chapters[cur]?.name}</span>
          <em aria-hidden="true">▾</em>
        </button>
        <i className={s.prog} style={{ transform: `scaleX(${prog})` }} data-chapter-prog aria-hidden="true" />
      </div>
      <BottomSheet open={list} onClose={close} title="장 목록" label="장 목록">
        <ul className={s.toc}>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button type="button" onClick={() => go(c.id)} data-chapter-go aria-current={i === cur ? 'true' : undefined}>
                <b>{pad(i + 1)}</b>{c.name}{i === cur ? <small>지금</small> : null}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
