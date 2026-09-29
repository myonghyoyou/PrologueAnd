import { heroFigure, isPinnedHero, isScatterHero, type Project, type Study } from '@/content';
import { FRAME_PAD } from '@/lib/figure-rules';
import { Frame } from './frame';
import { DayBoard } from './day-board';
import s from './cover.module.css';

/** 문제 장면(흩어진 요청 더미)의 틀 — 와이프 뒤의 결과 화면(queue 1280×800 + 틀 12)과 같은 크기라, 02 장에서 이 더미가 그 화면으로 바뀐다 */
const SCATTER_W = 1292, SCATTER_H = 812;

export function Cover({ study, project }: { study: Study; project: Project }) {
  const c = study.cover;
  const fig = heroFigure(c.hero);
  const heroW = fig ? (fig.w ?? 0) + FRAME_PAD * 2 : SCATTER_W;
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
        ) : isPinnedHero(c.hero) ? (
          <div className={s.pinned} data-hero-pinned style={{ maxWidth: heroW }}>
            <Frame fig={c.hero.pinned} sizes="(max-width:1023px) 100vw, 1616px">
              {c.hero.pins.map((p, i) => (
                // 틀 안(테두리 1 + 여백 6) 좌표 — 핫스팟과 같은 계산
                <span key={i} className={s.pin} data-pin aria-hidden="true"
                      style={{ left: `calc(6px + (100% - 12px) * ${p.x / 100})`, top: `calc(6px + (100% - 12px) * ${p.y / 100})` }}>{i + 1}</span>
              ))}
            </Frame>
            <ol className={s.legend}>
              {c.hero.pins.map((p, i) => <li key={i} data-pin-note><b aria-hidden="true">{i + 1}</b><span>{p.text}</span></li>)}
            </ol>
          </div>
        ) : fig ? <Frame fig={fig} sizes="(max-width:1023px) 100vw, 1616px" /> : null}
      </div>
    </section>
  );
}
