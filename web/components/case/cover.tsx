import type { Project, Study } from '@/content';
import { Frame } from './frame';
import s from './cover.module.css';

export function Cover({ study, project }: { study: Study; project: Project }) {
  const c = study.cover;
  return (
    <section className={s.cover} data-cover>
      <div className={c.numbers?.length ? s.title : `${s.title} ${s.solo}`} data-cover-title>
        <div>
          <span className={s.cap}>{project.title}</span>
          <h1 className={s.h1} data-title dangerouslySetInnerHTML={{ __html: c.title }} />
          {c.summary.map((t, i) => <p key={i} className={s.summary}>{t}</p>)}
          <table className={s.meta}>
            <tbody>
              {c.meta.map(([k, v]) => <tr key={k} data-meta-row><td>{k}</td><td>{v}</td></tr>)}
            </tbody>
          </table>
        </div>
        {c.numbers?.length ? (
          <div className={s.nums}>
            {c.numbers.map((n) => (
              <div key={n.label} data-num><b>{n.value}</b><span>{n.label}</span>{n.small ? <small>{n.small}</small> : null}</div>
            ))}
          </div>
        ) : null}
      </div>
      <div className={s.hero}>
        <Frame fig={c.hero} sizes="(max-width:1023px) 100vw, 1616px" />
      </div>
    </section>
  );
}
