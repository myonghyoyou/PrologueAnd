import type { StepsBlock } from '@/content';
import g from './grid.module.css';
import s from './steps.module.css';

/** 순서 비교 — 줄마다 라벨 + 단계 칸(같은 열 격자). 움직임 없음. 읽는 순서 = 단계 순서 */
export function Steps({ b }: { b: StepsBlock }) {
  const n = Math.max(...b.rows.map((r) => r.steps.length));
  return (
    <div className={g.g}>
      <figure className={`${g.wide} ${s.fig}`} data-steps role="group" aria-label={b.alt}>
        {b.rows.map((r, i) => (
          <div key={i} className={s.row} data-steps-row data-last={i === b.rows.length - 1 ? '' : undefined}>
            <p className={s.label}>{r.label}</p>
            <ol className={s.steps} style={{ ['--n' as string]: n }}>
              {r.steps.map((x, j) => (
                <li key={j} className={s.step} data-step data-gap={x === '…' ? '' : undefined}>
                  <span>{x}</span>
                  {j < r.steps.length - 1 ? <i className={s.arrow} aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
          </div>
        ))}
        {b.caption ? <figcaption className={s.cap}>{b.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
