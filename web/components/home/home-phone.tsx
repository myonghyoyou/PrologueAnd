'use client';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HERO, PANELS, NEED, WORKS, CONTACT } from './copy';
import { CONTACT_MAIL } from '@/lib/contact';
import s from './home-phone.module.css';

/** 엉킨 선 — 시안 home-h1-v9 의 좌표(366×776 기준 3차 곡선 11조각). 마지막 조각은 아래를 향해 끝나
 *  꼬리의 첫 방향과 한 직선 위에 있다(이음매가 꺾이지 않게) */
const START: [number, number] = [150, 150];
const SEGS: [number, number][][] = [
  [[330, 110], [340, 300], [230, 260]], [[120, 220], [60, 120], [200, 180]], [[300, 240], [90, 330], [60, 250]],
  [[30, 170], [260, 150], [280, 330]], [[300, 470], [80, 400], [110, 300]], [[140, 200], [330, 380], [250, 440]],
  [[160, 510], [40, 380], [150, 370]], [[280, 360], [320, 560], [200, 520]], [[70, 480], [150, 330], [240, 420]],
  [[320, 500], [120, 600], [90, 520]], [[68, 461], [176, 462], [172, 560]],
];
type Geo = { d: string; w: number; h: number; rail: { top: number; height: number } };

/** 폰 홈(H1) — 첫 화면에 엉킨 선이 그려지고, 선 끝이 첫 판의 점으로 들어가 판들을 세로 선으로 꿴다(모바일 명세 §4) */
export function HomePhone({ projects }: { projects: { slug: string; title: string; year: string }[] }) {
  const intro = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [hint, setHint] = useState(false);

  // 선의 모양은 화면 크기와 첫 판의 점 위치로 정한다 — 폭이 바뀌면 다시 잰다
  useLayoutEffect(() => {
    const measure = () => {
      if (!intro.current || !list.current) return;
      const box = intro.current.getBoundingClientRect();
      const dots = [...list.current.querySelectorAll<HTMLElement>('[data-dot]')];
      if (!dots.length || box.width === 0) return;
      const c = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }; };
      const first = c(dots[0]), last = c(dots[dots.length - 1]);
      const sx = box.width / 366, sy = box.height / 776;
      const P = ([x, y]: [number, number]) => `${(x * sx).toFixed(1)} ${(y * sy).toFixed(1)}`;
      let d = `M${P(START)}`;
      for (const [a, b, e] of SEGS) d += ` C${P(a)}, ${P(b)}, ${P(e)}`;
      // 꼬리: 마지막 조각의 끝 방향(176,462 → 172,560)을 그대로 이어 내려오다가 첫 판의 점으로 휘어 들어간다
      d += ` C${P([168, 660])}, ${first.x.toFixed(1)} ${(first.y - 200 * sy).toFixed(1)}, ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
      const listTop = list.current.getBoundingClientRect().top - box.top;
      setGeo({ d, w: box.width, h: first.y + 2, rail: { top: first.y - listTop, height: last.y - first.y } });
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // 안내: 선을 다 그린 뒤 뜨고, 내리기 시작하면 사라진다
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const t = setTimeout(() => { if (window.scrollY < 8) setHint(true); }, reduced ? 0 : 2050);
    const onScroll = () => { if (window.scrollY > 8) setHint(false); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, []);

  // 판이 화면 아래 72% 선을 넘으면 점이 채워지고 글이 또렷해진다. 모션 줄이기면 처음부터
  useEffect(() => {
    const panels = [...(list.current?.querySelectorAll<HTMLElement>('[data-panel]') ?? [])];
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) { panels.forEach((p) => p.setAttribute('data-in', '')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.setAttribute('data-in', ''); }),
      { rootMargin: '0px 0px -28% 0px' });
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  const html = (h: string) => ({ __html: h });
  return (
    <div className={s.root} data-home-phone>
      <div ref={intro} className={s.intro} data-intro>
        {geo ? (
          <svg className={s.svg} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
            <path className={s.line} d={geo.d} pathLength={1} data-home-line />
          </svg>
        ) : null}
        <p className={s.hint} data-home-hint data-on={hint ? '' : undefined} aria-hidden={hint ? undefined : true}>
          아래로 내려 보세요<i aria-hidden="true">↓</i>
        </p>
      </div>
      <div ref={list} className={s.list}>
        {geo ? <i className={s.rail} style={{ top: geo.rail.top, height: geo.rail.height }} data-rail aria-hidden="true" /> : null}
        <section className={s.panel} data-panel>
          <i className={s.dot} data-dot aria-hidden="true" />
          <h1 className={s.h} dangerouslySetInnerHTML={html(HERO.h)} />
          <p className={s.p}>{HERO.p}</p>
          <div className={s.cta}>
            <button type="button" className={s.btn} data-open-drawer>프로젝트 문의</button>
            <a className={`${s.btn} ${s.ghost}`} href="#works">작업 보기</a>
          </div>
        </section>
        {PANELS.map((x) => (
          <section key={x.h} className={s.panel} data-panel>
            <i className={s.dot} data-dot aria-hidden="true" />
            <h2 className={s.h} dangerouslySetInnerHTML={html(x.h)} />
            <p className={s.p}>{x.p}</p>
          </section>
        ))}
        <section className={s.panel} data-panel>
          <i className={s.dot} data-dot aria-hidden="true" />
          <h2 className={s.h} dangerouslySetInnerHTML={html(NEED.h)} />
          <ul className={s.paths}>{NEED.items.map((i) => <li key={i.t} data-path><b>{i.t}</b><span>{i.d}</span></li>)}</ul>
        </section>
        <section className={s.panel} data-panel id="works">
          <i className={s.dot} data-dot aria-hidden="true" />
          <h2 className={s.h}>작업<br /><span data-published>{projects.length}</span>건.</h2>
          <p className={s.p}>{WORKS.p}</p>
          <ul className={s.works}>{projects.map((p) => (
            <li key={p.slug}><Link href={`/projects/${p.slug}`} data-work><b>{p.title}</b><span>{p.year}</span></Link></li>
          ))}</ul>
        </section>
        <section className={s.panel} data-panel>
          <i className={s.dot} data-dot aria-hidden="true" />
          <h2 className={s.h} dangerouslySetInnerHTML={html(CONTACT.h)} />
          <p className={s.p}>{CONTACT.p}</p>
          <div className={s.cta}>
            <button type="button" className={s.btn} data-open-drawer>프로젝트 문의하기</button>
            <a className={s.mail} href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a>
          </div>
        </section>
      </div>
    </div>
  );
}
