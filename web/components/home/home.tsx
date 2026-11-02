import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import type { Project } from '@/content/types';
import { CONTACT_MAIL } from '@/lib/contact';
import { HERO, HOW, CAN, SERVICES, WORK, WORK_HEAD, CONTACT, type WorkEntry, type Shot, type Detail } from './copy';
import { Amp } from './amp';
import { BeforeAfter } from './before-after';
import { AMP_GATE } from './amp-enter';
import { Scenes } from './scenes';
import { TwoState } from './two-state';
import s from './home.module.css';

const no = (i: number) => String(i + 1).padStart(2, '0');
/** 머리글 낱말 채우기 — 낱말마다 span(data-w). 움직임이 없으면 그대로 진한 글자다. em 은 그 번째 줄을 강조 */
const words = (ls: readonly string[], em?: number) => ls.map((l, i) => {
  const ws = l.split(' ').map((w, k) => <Fragment key={k}>{k > 0 ? ' ' : null}<span data-w>{w}</span></Fragment>);
  return <Fragment key={l}>{i > 0 ? <br /> : null}{i === em ? <em>{ws}</em> : ws}</Fragment>;
});

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

/** 작업 머리 — 번호·연도(·상태), 이름 */
function CaseHead({ p, w, i }: { p: Project; w: WorkEntry; i: number }) {
  return (
    <>
      <div className={s.meta}>
        <span className={s.num}>{no(i)}</span><span className={s.label}>{p.year}</span>
        {w.status ? <span className={s.status}>{w.status}</span> : null}
      </div>
      <h3 className={s.caseT}>{p.title}</h3>
    </>
  );
}
/** 문제 → 설계 판단(→ 바꾼 것). 첫 작업은 바꾼 것을 머리 줄에 크게 따로 둔다 */
function QA({ w, changed = true }: { w: WorkEntry; changed?: boolean }) {
  return (
    <dl className={s.qa}>
      <dt>문제</dt><dd>{w.problem}</dd>
      <dt>설계 판단</dt><dd>{w.decision}</dd>
      {changed ? <><dt>바꾼 것</dt><dd>{w.changed}</dd></> : null}
    </dl>
  );
}
const More = ({ p }: { p: Project }) => <Link className={s.link} href={`/projects/${p.slug}`}>자세히 보기 →</Link>;

/** 작업 넷 — 자료마다 다른 장면.
 *  wide(요청 처리): 그림이 화면 대부분으로 커진다 · phones(문제 은행): 두 화면이 서로 다른 빠르기로 올라온다
 *  pair(병원): 스크롤이 전·후 비교의 가운데 선을 옮긴다 · full(근무표): 선이 짚은 자리가 크게 열린다 */
function Case({ p, w, i }: { p: Project; w: WorkEntry; i: number }) {
  const attrs = { 'data-work': p.slug, 'data-layout': w.layout, id: `w-${p.slug}` };
  if (w.layout === 'wide') return (
    <article className={`${s.case} ${s.wide}`} {...attrs} data-scene="grow">
      <div className={s.stage} data-stage>
        <div className={`${s.wrap} ${s.stageIn} ${s.growIn}`}>
          <div className={s.band}>
            <div className={s.bandHead}><CaseHead p={p} w={w} i={i} /></div>
            <p className={s.result}><span className={s.label}>바꾼 것</span>{w.changed}</p>
            <More p={p} />
          </div>
          <div className={s.growTxt} data-fade><QA w={w} changed={false} /></div>
          <div className={s.slot} data-slot aria-hidden="true" />
          <div className={s.pic} data-grow>{w.toggle
            ? <TwoState names={w.toggle.names} shots={[w.shots[0], w.toggle.next]} sizes="(min-width:1024px) 88vw, 100vw" />
            : <Pic shot={w.shots[0]} sizes="(min-width:1024px) 88vw, 100vw" />}</div>
        </div>
      </div>
    </article>
  );
  if (w.layout === 'phones') return (
    <article className={`${s.case} ${s.phones}`} {...attrs} data-scene="rise">
      <div className={`${s.wrap} ${s.caseIn}`}>
        <div className={s.txt}><CaseHead p={p} w={w} i={i} /><QA w={w} /><More p={p} /></div>
        <div className={s.devs}>
          {w.shots.map((sh) => (
            <figure key={sh.src} className={s.fig} data-dev>
              <div className={s.dev} data-zoom={sh.src} data-zoom-alt={sh.alt}><Image src={sh.src} alt={sh.alt} width={sh.w} height={sh.h} sizes="(min-width:1024px) 24vw, 44vw" /></div>
              <figcaption className={s.cap}>{sh.cap}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </article>
  );
  if (w.layout === 'pair') return (
    <article className={`${s.case} ${s.pair}`} {...attrs} data-scene="sweep">
      <div className={s.stage} data-stage>
        <div className={`${s.wrap} ${s.stageIn} ${s.pairIn}`}>
          <div className={s.pairTxt}>
            <CaseHead p={p} w={w} i={i} />
            <p className={s.result}>{w.changed}</p>
            <p className={s.pairMore}><More p={p} /></p>
            {w.marks ? (
              <ol className={s.marks} data-compare aria-label="짚은 자리">
                {w.marks.map((m, k) => <li key={m.t}><span className={s.markNo} aria-hidden="true">{k + 1}</span>{m.t}</li>)}
                <li className={s.more}>그 밖의 비교는 <Link href={`/projects/${p.slug}`}>사례 상세</Link>에 있습니다.</li>
              </ol>
            ) : null}
          </div>
          <div className={s.baWrap}><BeforeAfter before={w.shots[0]} after={w.shots[1]} marks={w.marks} /></div>
          <div className={s.pairQa}><QA w={w} changed={false} /></div>
        </div>
      </div>
    </article>
  );
  return (
    <article className={`${s.case} ${s.full}`} {...attrs} data-scene="zoom">
      <div className={s.stage} data-stage>
        <div className={`${s.wrap} ${s.stageIn} ${s.zoomIn}`}>
          <div className={s.zoomHead}><div><CaseHead p={p} w={w} i={i} /></div><p className={s.result}>{w.changed}</p><More p={p} /></div>
          <div className={s.fullPic}>{w.toggle
            ? <TwoState names={w.toggle.names} shots={[w.shots[0], w.toggle.next]} sizes="(min-width:1024px) 80vw, 100vw" />
            : <Pic shot={w.shots[0]} sizes="(min-width:1024px) 80vw, 100vw" />}</div>
          {w.details?.map((d) => (
            <div key={d.cap} className={s.fd} data-zoomed>
              <div className={s.fdPic}><Crop d={{ ...d, cap: undefined }} /></div>
              <p className={s.fdCap}><span className={s.label}>확대</span>{d.cap}</p>
            </div>
          ))}
          <div className={s.zoomQa}><QA w={w} changed={false} /></div>
        </div>
      </div>
    </article>
  );
}

/** 홈 — 장면이 이어지는 세로 페이지. 첫 화면 → 일하는 방식(큰 글자 · 세 단계) → 할 수 있는 일 → 작업(남색, 자료 넷) → 문의.
 *  움직임(P2, docs/superpowers/specs/2026-10-29-home-motion-p2.md): 첫 & 등장 · 잇는 선과 장면 · 머리글 채우기 · 전후 비교 + Lenis = 5종.
 *  모두 꺼져도(스크립트 실패·모션 줄이기) 글과 그림은 같은 위계로 그대로 보인다 */
export function Home({ projects }: { projects: Project[] }) {
  const works = projects.filter((p) => WORK[p.slug]);
  const bySlug = new Map(works.map((p) => [p.slug, p]));
  const groups = [...new Set(SERVICES.map((v) => v.group))];
  const [near, far] = HOW.h[1].split(HOW.find).map((x) => x.trim());
  return (
    <div className={s.root} data-home>
      <script dangerouslySetInnerHTML={{ __html: AMP_GATE }} />
      <Scenes />
      <section className={s.heroSec} data-sec="hero" data-host aria-labelledby="home-h1">
        <div className={`${s.wrap} ${s.hero}`}>
          <p className={s.label}>{HERO.label}</p>
          <div className={s.heroTop}>
            <h1 id="home-h1" className={s.h1}>{HERO.h.map((l) => <span key={l} className={s.hl}><span>{l}</span></span>)}</h1>
            <Amp className={s.heroAmp} which="hero" />
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
        </div>
      </section>

      <section id="how" data-sec="how">
        {/* 큰 글자 — 선이 02 머리 선 끝에 닿으면 문장이 올라오고, 「불편한지」 밑을 지나는 동안 주변 글자가 물러난다 */}
        <div className={s.scene} data-scene="focus">
          <div className={s.stage} data-stage>
            <div className={`${s.wrap} ${s.stageIn}`}>
              <SectionHead n="02" t="일하는 방식" />
              <h2 className={s.focusH} data-focus>
                <span className={s.fSmall} data-dim>{HOW.h[0]}</span>{' '}
                <span className={s.fSmall} data-dim>{near}</span>{' '}
                <span className={s.fRow}><span className={s.fBig} data-mark="find">{HOW.find}</span>{' '}<span className={s.fSmall} data-dim>{far}</span></span>
              </h2>
            </div>
          </div>
        </div>
        {/* 세 단계 — 선이 단계 머리에 닿을 때마다 그 단계가 앞으로 나온다(큰 글자 → 자리 이동 → 선이 고쳐 긋기) */}
        <div className={s.scene} data-scene="steps">
          <div className={s.stage} data-stage>
            <div className={`${s.wrap} ${s.stageIn}`}>
              <ol className={s.steps}>
                {HOW.steps.map((st, i) => (
                  <li key={st.t} className={s.step} data-step={i + 1}>
                    <h3><span className={s.num}>{no(i)}</span><span className={s.stepT}>{st.t}</span></h3>
                    <div className={s.stepBody}>
                      <p>{st.p}</p>
                      <ul className={s.kw} aria-label="하는 일">{st.kw.map((k) => <li key={k}>{k}</li>)}</ul>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className={s.can} id="can" data-sec="can" data-host>
        <div className={s.wrap}>
          <SectionHead n="03" t="할 수 있는 일" />
          <p className={s.intro}>{CAN.p}</p>
          <div className={s.rows}>
            {SERVICES.map((v, i) => {
              const rel = v.rel.map((slug) => bySlug.get(slug)).filter((p): p is Project => !!p);
              return (
                <div key={v.id} className={s.row} id={`s-${v.id}`} data-can data-group={v.group}>
                  <p className={s.rowMeta}><span className={s.num}>{no(i)}</span>{v.label}</p>
                  <h3 className={s.rowT} data-fill>{words([v.t])}</h3>
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
        </div>
      </section>

      <section className={s.work} id="work" data-sec="work">
        {/* 명암 전환 — 선이 내려오는 만큼 남색이 덮이고, 덮인 자리에 작업을 여는 큰 문구가 드러난다 */}
        <div className={s.scene} data-scene="dark">
          <div className={s.stage} data-stage>
            <div className={s.curtain} data-curtain>
              <div className={`${s.wrap} ${s.stageIn} ${s.darkIn}`}>
                <SectionHead n="04" t="작업" />
                <h2 className={s.workT}>{WORK_HEAD.h}</h2>
                <div className={s.workSide}><p className={s.label}><span data-published>{works.length}</span>건</p><p>{WORK_HEAD.p}</p></div>
              </div>
            </div>
          </div>
        </div>
        {works.map((p, i) => <Case key={p.slug} p={p} w={WORK[p.slug]} i={i} />)}
        <div className={s.allHost} data-host data-all>
          <div className={s.wrap}><div className={s.all}><b>모든 작업</b><Link className={s.btn} href="/projects">Projects 보기 <span aria-hidden="true">→</span></Link></div></div>
        </div>
      </section>

      <section className={s.contact} id="contact" data-sec="contact" data-closing data-host>
        <div className={s.wrap}>
          <SectionHead n="05" t="문의" />
          <div className={s.contactGrid}>
            <h2 className={s.contactT} data-fill>{words(CONTACT.h, 1)}</h2>
            <p className={s.contactP}>{CONTACT.p}</p>
            <div className={s.act}>
              <button type="button" className={`${s.btn} ${s.fill}`} data-open-drawer>프로젝트 문의하기 <span aria-hidden="true">→</span></button>
              <a className={s.mail} href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a>
            </div>
            <Amp className={s.contactAmp} which="contact" />
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
