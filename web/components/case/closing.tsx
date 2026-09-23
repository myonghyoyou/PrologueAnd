import Image from 'next/image';
import { ViewTransitionLink } from '../view-transition-link';
import { COVERS, type Project, type Study } from '@/content';
import g from './grid.module.css';
import t from './type.module.css';
import s from './closing.module.css';

export function Closing({ study, next, slug }: { study: Study; next?: Project; slug: string }) {
  return (
    <section className={s.closing} data-closing>
      <div className={g.g}>
        <div className={g.body}>
          {study.builtWith?.length ? <p className={s.built}>Built with · {study.builtWith.join(' · ')}</p> : null}
          <h2 className={t.h2}>비슷한 문제가 있다면</h2>
          <p className={t.lead}>{study.cta}</p>
          <div className={s.cta}>
            <button type="button" data-cta data-open-drawer data-project={slug} className={s.btn}>
              이 프로젝트를 보고 문의하기 <i className={s.tri} aria-hidden />
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
            <p className={s.tag}>{next.tagline}</p>
          </div>
          {COVERS.has(next.slug) ? (
            <Image src={`/screens/covers/${next.slug}.png`} alt="" width={512} height={320} className={s.teaserImg} />
          ) : null}
        </ViewTransitionLink>
      ) : (
        <a className={s.teaser} data-teaser href="/projects">
          <div>
            <span className={s.cap}>다음 이야기</span>
            <span className={s.big}>Projects</span>
            <p className={s.tag}>나머지 작업은 정리하는 대로 올립니다.</p>
          </div>
        </a>
      )}
    </section>
  );
}
