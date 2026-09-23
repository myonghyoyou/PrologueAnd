'use client';
import Image from 'next/image';
import { ViewTransitionLink } from '../view-transition-link';
import { COVERS, type Case, type Project } from '@/content';
import s from './finale.module.css';

export function Finale({ data, next, slug }: { data: Case; next?: Project; slug: string }) {
  return (
    <section id="s09" className={s.pan} data-pan="finale">
      <div className={s.two}>
        <div data-text>
          <span className={s.lab}>09 WHAT I LEARNED</span>
          <h2 className={s.h2} dangerouslySetInnerHTML={{ __html: data.s09.h }} />
          {data.s09.p.map((t, i) => <p key={i} className={s.p}>{t}</p>)}
        </div>
        <div data-text>
          <span className={s.lab}>10</span>
          <h2 className={s.h2}>비슷한 문제가 있다면</h2>
          {data.s10.p.map((t, i) => <p key={i} className={s.p}>{t}</p>)}
          <div className={s.cta}>
            <button type="button" data-cta data-open-drawer data-project={slug} className={s.btn}>
              이 프로젝트를 보고 문의하기
            </button>
            <a href="mailto:PrologueAnd@gmail.com" className={s.mail}>PrologueAnd@gmail.com</a>
          </div>
        </div>
      </div>

      {next ? (
        <ViewTransitionLink className={s.teaser} data-teaser href={`/projects/${next.slug}`} vtType="to-case">
          <div>
            <span className={s.cap}>다음 이야기</span>
            <span className={s.big}>{next.title}</span>
            <p className={s.p}>{next.tagline}</p>
          </div>
          {/* 표지 PNG 가 없는 편이 있다 — 있을 때만 그린다 (시안은 onerror 로 지웠다) */}
          {COVERS.has(next.slug) ? (
            <Image data-teaser-img src={`/screens/covers/${next.slug}.png`} alt="" width={512} height={320}
                   className={s.teaserImg} />
          ) : null}
        </ViewTransitionLink>
      ) : (
        <a className={s.teaser} data-teaser href="/projects">
          <div>
            <span className={s.cap}>다음 이야기</span>
            <span className={s.big}>Projects</span>
            <p className={s.p}>나머지 작업은 정리하는 대로 올립니다.</p>
          </div>
        </a>
      )}
    </section>
  );
}
