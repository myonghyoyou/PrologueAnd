import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import type { Project } from '@/content/types';
import { CONTACT_MAIL } from '@/lib/contact';
import { HERO, HOW, CAN, WORK, WORK_P, CONTACT, type WorkEntry, type Shot } from './copy';
import { StepLine } from './step-line';
import s from './home.module.css';

const lines = (ls: string[]) => ls.map((l, i) => <Fragment key={l}>{i > 0 ? <br /> : null}{l}</Fragment>);

/** 섹션 머리 — 번호(세리프)와 이름, 위에 굵은 선 하나 */
function SectionHead({ n, t }: { n: string; t: string }) {
  return <div className={s.sh}><span className={s.num}>{n}</span><span className={s.shT}>{t}</span></div>;
}

const Pic = ({ shot, sizes, priority }: { shot: Shot; sizes: string; priority?: boolean }) => (
  <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} sizes={sizes} priority={priority} />
);

function CaseText({ p, w, i, more }: { p: Project; w: WorkEntry; i: number; more?: boolean }) {
  return (
    <>
      <div className={s.meta}><span className={s.num}>{String(i + 1).padStart(2, '0')}</span><span className={s.label}>{p.year}</span></div>
      <h3 className={s.caseT}>{p.title}</h3>
      <p className={s.k}>문제</p><p className={s.kp}>{w.problem}</p>
      <p className={s.k}>바꾼 것</p><p className={s.kp}>{w.changed}</p>
      {more === false ? null : <Link className={s.link} href={`/projects/${p.slug}`}>자세히 보기 →</Link>}
    </>
  );
}

function Case({ p, w, i }: { p: Project; w: WorkEntry; i: number }) {
  const more = <Link className={s.link} href={`/projects/${p.slug}`}>자세히 보기 →</Link>;
  if (w.layout === 'wide') return (
    <article className={`${s.case} ${s.wide}`} data-work={p.slug} data-layout={w.layout} id={`w-${p.slug}`}>
      <figure className={s.pic}><div className={s.frame}><Pic shot={w.shots[0]} sizes="(min-width:1024px) 66vw, 100vw" /></div>{w.caption ? <figcaption className={s.cap}>{w.caption}</figcaption> : null}</figure>
      <div className={s.txt}><CaseText p={p} w={w} i={i} /></div>
    </article>
  );
  if (w.layout === 'phones') return (
    <article className={`${s.case} ${s.phones}`} data-work={p.slug} data-layout={w.layout} id={`w-${p.slug}`}>
      <div className={s.txt}><CaseText p={p} w={w} i={i} /></div>
      <div className={s.devs}>{w.shots.map((sh) => <div key={sh.src} className={s.dev}><Pic shot={sh} sizes="(min-width:1024px) 26vw, 46vw" /></div>)}</div>
    </article>
  );
  if (w.layout === 'pair') return (
    <article className={`${s.case} ${s.pair}`} data-work={p.slug} data-layout={w.layout} id={`w-${p.slug}`}>
      <div className={s.pairA}>
        <div className={s.meta}><span className={s.num}>{String(i + 1).padStart(2, '0')}</span><span className={s.label}>{p.year}</span></div>
        <h3 className={s.caseT}>{p.title}</h3>
        <p className={s.k}>문제</p><p className={s.kp}>{w.problem}</p>
      </div>
      <div className={s.pairB}><p className={s.k}>바꾼 것</p><p className={s.kp}>{w.changed}</p>{more}</div>
      <div className={s.pairPics}>
        {w.shots.map((sh) => (
          <figure key={sh.src}>
            {sh.label ? <figcaption className={s.lab}>{sh.label[0]} <span>{sh.label[1]}</span></figcaption> : null}
            <div className={s.frame}><Pic shot={sh} sizes="(min-width:1024px) 40vw, 100vw" /></div>
          </figure>
        ))}
      </div>
    </article>
  );
  return (
    <article className={`${s.case} ${s.full}`} data-work={p.slug} data-layout={w.layout} id={`w-${p.slug}`}>
      <div className={`${s.frame} ${s.fullPic}`}><Pic shot={w.shots[0]} sizes="(min-width:1024px) 80vw, 100vw" /></div>
      <div className={s.f1}>
        <div className={s.meta}><span className={s.num}>{String(i + 1).padStart(2, '0')}</span><span className={s.label}>{p.year}</span></div>
        <h3 className={s.caseT}>{p.title}</h3>
      </div>
      <div className={s.f2}><p className={s.k}>문제</p><p className={s.kp}>{w.problem}</p><p className={s.k}>바꾼 것</p><p className={s.kp}>{w.changed}</p></div>
      <div className={s.f3}>{more}</div>
    </article>
  );
}

/** 홈 — 편집형 세로 페이지(P1). 첫 화면 → 일하는 방식 → 할 수 있는 일 → 작업 → 문의.
 *  움직임은 넣지 않는다. P2 는 data-step-line(계단 선)과 섹션 경계([data-sec])에 붙인다 */
export function Home({ projects }: { projects: Project[] }) {
  const works = projects.filter((p) => WORK[p.slug]);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  return (
    <div className={s.root} data-home>
      <section className={`${s.wrap} ${s.hero}`} data-sec="hero" aria-labelledby="home-h1">
        <p className={s.label}>{HERO.label}</p>
        <div className={s.heroTop}>
          <h1 id="home-h1" className={s.h1}>{lines(HERO.h)}</h1>
          <span className={s.heroAmp} aria-hidden="true">&amp;</span>
        </div>
        <div className={s.heroFoot}>
          <ul className={s.svc} aria-label="하는 일">{HERO.services.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className={s.lede}>{HERO.p}</p>
          <div className={s.cta}>
            <button type="button" className={`${s.btn} ${s.fill}`} data-open-drawer>프로젝트 문의 <span aria-hidden="true">→</span></button>
            <a className={s.btn} href="#work">작업 보기 <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section className={s.wrap} id="how" data-sec="how">
        <SectionHead n="02" t="일하는 방식" />
        <h2 className={s.lead}>{lines(HOW.h)}</h2>
        <div className={s.steps}>
          <StepLine className={s.stepLine} />
          {HOW.steps.map((st, i) => (
            <div key={st.t} className={s.step} data-step>
              <i className={s.dot} data-step-dot aria-hidden="true" />
              <span className={s.num}>{String(i + 1).padStart(2, '0')}</span>
              <h3>{st.t}</h3>
              <p>{st.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.wrap} id="can" data-sec="can">
        <SectionHead n="03" t="할 수 있는 일" />
        <p className={s.intro}>{CAN.p}</p>
        <div className={s.rows}>
          {CAN.rows.map((r) => {
            const rel = r.rel.map((slug) => bySlug.get(slug)).filter((p): p is Project => !!p && !!WORK[p.slug]);
            return (
              <div key={r.v} className={s.row} data-can>
                <span className={s.v}>{r.v}</span>
                <div className={s.what}><b>{r.name}</b><span>{r.d}</span></div>
                <div className={s.rel}>
                  {rel.length ? <>관련 작업 · {rel.map((p, i) => <Fragment key={p.slug}>{i > 0 ? ', ' : null}<a href={`#w-${p.slug}`}>{p.title}</a></Fragment>)}</> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={s.wrap} id="work" data-sec="work">
        <SectionHead n="04" t="작업" />
        <div className={s.workHead}>
          <h2 className={s.workT}>작업 <span data-published>{works.length}</span>건.</h2>
          <p>{WORK_P}</p>
        </div>
        {works.map((p, i) => <Case key={p.slug} p={p} w={WORK[p.slug]} i={i} />)}
        <div className={s.all}><b>모든 작업</b><Link className={s.btn} href="/projects">Projects 보기 <span aria-hidden="true">→</span></Link></div>
      </section>

      <section className={s.contact} id="contact" data-sec="contact" data-closing>
        <div className={s.wrap}>
          <SectionHead n="05" t="문의" />
          <div className={s.contactGrid}>
            <h2 className={s.contactT}>{CONTACT.h[0]}<br /><em>{CONTACT.h[1]}</em><br />{CONTACT.h[2]}</h2>
            <p className={s.contactP}>{CONTACT.p}</p>
            <div className={s.act}>
              <button type="button" className={`${s.btn} ${s.fill}`} data-open-drawer>프로젝트 문의하기 <span aria-hidden="true">→</span></button>
              <a className={s.mail} href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a>
            </div>
            <span className={s.contactAmp} aria-hidden="true">&amp;</span>
          </div>
          <footer className={s.end} data-footer>
            <span>{CONTACT.end}</span>
            <nav aria-label="바닥글">
              <Link href="/projects">Projects</Link>
              <Link href="/tools/brief">요청서 만들기</Link>
              <span>© 2026</span>
            </nav>
          </footer>
        </div>
      </section>
    </div>
  );
}
