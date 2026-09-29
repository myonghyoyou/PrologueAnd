import { isScatterHero, type Project, type Study } from '@/content';
import { FRAME_PAD } from '@/lib/figure-rules';
import { Frame } from './frame';
import { DayBoard } from './day-board';
import s from './cover.module.css';

/** 문제 장면(흩어진 요청 더미)의 틀 — 와이프 뒤의 결과 화면(queue 1280×800 + 틀 12)과 같은 크기라, 02 장에서 이 더미가 그 화면으로 바뀐다 */
const SCATTER_W = 1292, SCATTER_H = 812;

export function Cover({ study, project }: { study: Study; project: Project }) {
  const c = study.cover;
  const heroW = isScatterHero(c.hero) ? SCATTER_W : (c.hero.w ?? 0) + FRAME_PAD * 2;
  return (
    <section className={s.cover} data-cover>
      <div className={c.numbers?.length ? s.title : `${s.title} ${s.solo}`} data-cover-title>
        <div>
          <span className={s.cap}>{project.title}</span>
          <h1 className={s.h1} data-title dangerouslySetInnerHTML={{ __html: c.title }} />
          {/* 소개 문단은 아래 대표 화면 틀과 같은 폭 — 틀처럼 칸 폭과 원본 픽셀 폭(+틀 여백) 중 작은 쪽 */}
          {c.summary.map((t, i) => <p key={i} className={s.summary} data-summary style={{ maxWidth: heroW }}>{t}</p>)}
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
        {isScatterHero(c.hero) ? (
          <figure className={s.scatter} data-hero-scatter style={{ maxWidth: SCATTER_W }}>
            <div className={s.scatterBox} role="img" aria-label={c.hero.alt} style={{ ['--ar' as string]: `${SCATTER_W} / ${SCATTER_H}` }}>
              <DayBoard items={c.hero.scatter} mark={c.hero.mark} />
            </div>
            {c.hero.caption ? <figcaption className={s.scatterCap}>{c.hero.caption}</figcaption> : null}
          </figure>
        ) : <Frame fig={c.hero} sizes="(max-width:1023px) 100vw, 1616px" />}
      </div>
    </section>
  );
}
