import { PROBLEM_NAME, type Project } from '@/content';
import { ViewTransitionLink } from './view-transition-link';
import s from './project-row.module.css';

export function ProjectRow({ project: p }: { project: Project }) {
  const body = (
    <>
      <span className={s.num}>{String(p.order).padStart(2, '0')}</span>
      <div>
        <div className={s.title} data-title>
          {p.title}
          {p.published ? null : <span className={s.soonTag}>준비 중</span>}
        </div>
        <div className={s.meta}>
          {p.tags.map((t) => <span key={t} className={s.tag}>{t}</span>)}
          <span>{p.year}</span>
          <span>{PROBLEM_NAME[p.problem]}</span>
          {p.featured ? <span style={{ color: 'var(--navy-800)' }}>대표</span> : null}
        </div>
        <p className={s.res}>{p.tagline}</p>
      </div>
    </>
  );
  return p.published ? (
    <ViewTransitionLink className={s.row} data-row data-slug={p.slug} href={`/projects/${p.slug}`} shareTitle slug={p.slug}>{body}</ViewTransitionLink>
  ) : (
    <div className={`${s.row} ${s.soon}`} data-row data-slug={p.slug}>{body}</div>
  );
}
