import type { Case, Project } from '@/content';
import s from './cover.module.css';

export function CoverText({ data, project }: { data: Case; project: Project }) {
  return (
    <div className={s.title} data-cover-title>
      <div>
        <span className={s.cap}>Prologue &amp; {project.title} · {data.cap}</span>
        <h1 className={s.h1} data-title style={{ viewTransitionName: 'pj-title' }} dangerouslySetInnerHTML={{ __html: data.title }} />
        <table className={s.meta}>
          <tbody>
            {data.meta.map(([k, v]) => (
              <tr key={k} data-meta-row><td>{k}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={s.nums}>
        {data.numbers.map((n) => (
          <div key={n.label} data-num>
            <b>{n.value}</b><span>{n.label}</span><small>{n.small}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
