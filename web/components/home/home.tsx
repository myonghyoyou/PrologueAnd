import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import type { Project } from '@/content/types';
import { CONTACT_MAIL } from '@/lib/contact';
import { HERO, HOW, CAN, SERVICES, WORK, WORK_HEAD, CONTACT, type WorkEntry, type Shot, type Detail } from './copy';
import { StepLine } from './step-line';
import s from './home.module.css';

const lines = (ls: readonly string[]) => ls.map((l, i) => <Fragment key={l}>{i > 0 ? <br /> : null}{l}</Fragment>);
const no = (i: number) => String(i + 1).padStart(2, '0');

/** 섹션 머리 — 번호(세리프)와 이름, 위에 굵은 선 하나 */
function SectionHead({ n, t }: { n: string; t: string }) {
  return <div className={s.sh}><span className={s.num}>{n}</span><span className={s.shT}>{t}</span></div>;
}

/** 원본 그림 한 장. 폰에서는 눌러서 크게 본다(ZoomViewer 의 data-zoom) */
function Pic({ shot, sizes }: { shot: Shot; sizes: string }) {
  return (
    <figure className={s.fig}>
      <div className={s.frame} data-zoom={shot.src} data-zoom-alt={shot.alt}>
        <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} sizes={sizes} />
      </div>
      {shot.cap ? <figcaption className={s.cap}>{shot.cap}</figcaption> : null}
    </figure>
  );
}

/** 원본의 % 영역만 크게 — 창 비율 = 자른 영역의 원본 비율. 원본 파일은 그대로 두고 위치만 옮긴다.
 *  확대하면 줄인 그림은 흐려지므로 원본을 그대로 받는다(같은 그림을 여러 번 잘라도 내려받기는 한 번) */
function Crop({ d }: { d: Detail }) {
  const [x, y, w, h] = d.crop;
  return (
    <figure className={s.fig} data-detail>
      <div className={s.frame} data-zoom={d.src} data-zoom-alt={d.alt} data-zoom-crop={d.crop.join(',')}>
        <div className={s.win} style={{ aspectRatio: `${(w / 100) * d.w} / ${(h / 100) * d.h}` }}>
          <Image src={d.src} alt={d.alt} width={d.w} height={d.h} unoptimized className={s.winImg}
                 style={{ width: `${(10000 / w).toFixed(3)}%`, left: `${(-x / w * 100).toFixed(3)}%`, top: `${(-y / h * 100).toFixed(3)}%` }} />
        </div>
      </div>
      {d.cap ? <figcaption className={s.cap}>{d.cap}</figcaption> : null}
    </figure>
  );
}

/** 작업 글 — 번호·연도(·상태), 이름, 문제, 바꾼 것, 상세 링크. 네 작업이 같은 순서를 쓴다 */
function CaseText({ p, w, i }: { p: Project; w: WorkEntry; i: number }) {
  return (
    <>
      <div className={s.meta}>
        <span className={s.num}>{no(i)}</span><span className={s.label}>{p.year}</span>
        {w.status ? <span className={s.status}>{w.status}</span> : null}
      </div>
      <h3 className={s.caseT}>{p.title}</h3>
      <dl className={s.qa}>
        <dt>문제</dt><dd>{w.problem}</dd>
        <dt>설계 판단</dt><dd>{w.decision}</dd>
        <dt>바꾼 것</dt><dd>{w.changed}</dd>
      </dl>
      <Link className={s.link} href={`/projects/${p.slug}`}>자세히 보기 →</Link>
    </>
  );
}

function Case({ p, w, i }: { p: Project; w: WorkEntry; i: number }) {
  const attrs = { 'data-work': p.slug, 'data-layout': w.layout, id: `w-${p.slug}` };
  if (w.layout === 'wide') return (
    <article className={`${s.case} ${s.wide}`} {...attrs}>
      <div className={s.pic}><Pic shot={w.shots[0]} sizes="(min-width:1024px) 62vw, 100vw" /></div>
      <div className={s.txt}>
        <CaseText p={p} w={w} i={i} />
        {w.details?.map((d) => <div key={d.cap} className={s.side}><Crop d={d} /></div>)}
      </div>
    </article>
  );
  if (w.layout === 'phones') return (
    <article className={`${s.case} ${s.phones}`} {...attrs}>
      <div className={s.txt}><CaseText p={p} w={w} i={i} /></div>
      <div className={s.devs}>
        {w.shots.map((sh) => (
          <figure key={sh.src} className={s.fig}>
            <div className={s.dev} data-zoom={sh.src} data-zoom-alt={sh.alt}><Image src={sh.src} alt={sh.alt} width={sh.w} height={sh.h} sizes="(min-width:1024px) 24vw, 44vw" /></div>
            <figcaption className={s.cap}>{sh.cap}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  );
  if (w.layout === 'pair') return (
    <article className={`${s.case} ${s.pair}`} {...attrs}>
      <div className={s.pairTxt}><CaseText p={p} w={w} i={i} /></div>
      <div className={s.pairPics}>{w.shots.map((sh) => <Pic key={sh.src} shot={sh} sizes="(min-width:1024px) 40vw, 100vw" />)}</div>
      <div className={s.cmp} data-compare>
        <p className={s.cmpHead}>가장 크게 달라진 곳</p>
        {w.compare?.map((c, k) => (
          <div key={c.cap} className={s.cmpRow}>
            <p className={s.cmpCap}><span className={s.num}>{k + 1}</span>{c.cap}</p>
            <div className={c.stack ? `${s.cmpPics} ${s.stack}` : s.cmpPics}>
              <div><span className={s.tag}>전</span><Crop d={c.before} /></div>
              <div><span className={s.tag}>후</span><Crop d={c.after} /></div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
  return (
    <article className={`${s.case} ${s.full}`} {...attrs}>
      <div className={s.fullTxt}><CaseText p={p} w={w} i={i} /></div>
      <div className={s.fullPic}><Pic shot={w.shots[0]} sizes="(min-width:1024px) 80vw, 100vw" /></div>
      {w.details?.map((d) => (
        <div key={d.cap} className={s.fd}>
          <div className={s.fdPic}><Crop d={{ ...d, cap: undefined }} /></div>
          <p className={s.fdCap}><span className={s.label}>확대</span>{d.cap}</p>
        </div>
      ))}
    </article>
  );
}

/** 홈 — 편집형 세로 페이지. 첫 화면 → 일하는 방식 → 할 수 있는 일 → 작업 → 문의.
 *  움직임은 넣지 않는다. P2 는 data-step-line(계단 선)과 섹션 경계([data-sec])에 붙인다 */
export function Home({ projects }: { projects: Project[] }) {
  const works = projects.filter((p) => WORK[p.slug]);
  const bySlug = new Map(works.map((p) => [p.slug, p]));
  const groups = [...new Set(SERVICES.map((v) => v.group))];
  return (
    <div className={s.root} data-home>
      <section className={`${s.wrap} ${s.hero}`} data-sec="hero" aria-labelledby="home-h1">
        <p className={s.label}>{HERO.label}</p>
        <div className={s.heroTop}>
          <h1 id="home-h1" className={s.h1}>{lines(HERO.h)}</h1>
          <span className={s.heroAmp} data-amp="hero" aria-hidden="true">&amp;</span>
        </div>
        <div className={s.heroFoot}>
          <div className={s.svc} aria-label="하는 일">
            {groups.map((g) => (
              <div key={g} className={s.svcGroup}>
                <p className={s.svcHead}>{g}</p>
                <ul>{SERVICES.filter((v) => v.group === g).map((v) => <li key={v.id}><a href={`#s-${v.id}`}>{v.t}</a></li>)}</ul>
              </div>
            ))}
          </div>
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
              <h3><span className={s.num}>{no(i)}</span>{st.t}</h3>
              <p>{st.p}</p>
              <ul className={s.kw} aria-label="하는 일">{st.kw.map((k) => <li key={k}>{k}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className={s.wrap} id="can" data-sec="can">
        <SectionHead n="03" t="할 수 있는 일" />
        <p className={s.intro}>{CAN.p}</p>
        <div className={s.rows}>
          {SERVICES.map((v, i) => {
            const rel = v.rel.map((slug) => bySlug.get(slug)).filter((p): p is Project => !!p);
            return (
              <div key={v.id} className={s.row} id={`s-${v.id}`} data-can>
                <p className={s.rowMeta}><span className={s.num}>{no(i)}</span>{v.label}</p>
                <h3 className={s.rowT}>{v.t}</h3>
                <div className={s.rowBody}>
                  <p>{v.d}</p>
                  {rel.length ? (
                    <p className={s.rel}>관련 작업 · {rel.map((p, k) => <Fragment key={p.slug}>{k > 0 ? ', ' : null}<a href={`#w-${p.slug}`}>{p.title}</a></Fragment>)}</p>
                  ) : (
                    <p className={s.rel}><button type="button" className={s.ask} data-open-drawer>이런 작업 문의하기 →</button></p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={s.wrap} id="work" data-sec="work">
        <SectionHead n="04" t="작업" />
        <div className={s.workHead}>
          <h2 className={s.workT}>{WORK_HEAD.h}</h2>
          <div className={s.workSide}><p className={s.label}><span data-published>{works.length}</span>건</p><p>{WORK_HEAD.p}</p></div>
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
            <span className={s.contactAmp} data-amp="contact" aria-hidden="true">&amp;</span>
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
