import type { ThreadBlock } from '@/content';
import g from './grid.module.css';
import s from './thread.module.css';

/** "오전 9:12" · "오후 2:05" → 분 */
const minutes = (at: string) => {
  const m = at.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);
  if (!m) return NaN;
  const h = Number(m[2]) % 12 + (m[1] === '오후' ? 12 : 0);
  return h * 60 + Number(m[3]);
};
const gapText = (a: string, b: string) => {
  const d = minutes(b) - minutes(a);
  if (!Number.isFinite(d) || d <= 0) return '';
  const h = Math.floor(d / 60), m = d % 60;
  return `${h ? `${h}시간 ` : ''}${m ? `${m}분 ` : ''}뒤`;
};

/** 메시지에서 같은 낱말(mark)에 표시 */
function Marked({ text, mark }: { text: string; mark?: string }) {
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const [head, ...rest] = text.split(mark);
  return <>{head}{rest.map((r, i) => <span key={i}><mark className={s.mark}>{mark}</mark>{r}</span>)}</>;
}

/** 같은 요청이 여러 번 온 장면 — 세로 선 위에 시각 순서대로, 사이에 흐른 시간을 적는다 */
export function Thread({ b }: { b: ThreadBlock }) {
  return (
    <div className={g.g}>
      <figure className={`${g.body} ${s.fig}`} data-thread>
        <ol className={s.list}>
          {b.items.map((it, i) => (
            <li key={i} className={s.item} data-thread-item>
              {i > 0 ? <span className={s.gap} data-thread-gap>{gapText(b.items[i - 1].at, it.at)}</span> : null}
              <div className={s.meta}><time>{it.at}</time><span>{it.from}</span></div>
              <p className={s.msg}><Marked text={it.text} mark={b.mark} /></p>
            </li>
          ))}
        </ol>
        {b.caption ? <figcaption className={s.cap}>{b.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
