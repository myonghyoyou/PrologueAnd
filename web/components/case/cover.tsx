import type { Project, Study } from '@/content';
import { FRAME_PAD } from '@/lib/figure-rules';
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
          {/* 소개 문단은 아래 대표 화면 틀과 같은 폭 — 틀처럼 칸 폭과 원본 픽셀 폭(+틀 여백) 중 작은 쪽 */}
          {c.summary.map((t, i) => <p key={i} className={s.summary} data-summary style={{ maxWidth: (c.hero.w ?? 0) + FRAME_PAD * 2 }}>{t}</p>)}
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
