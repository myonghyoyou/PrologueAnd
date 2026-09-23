import type { QuoteBlock } from '@/content';
import g from './grid.module.css';
import t from './type.module.css';
import s from './quote.module.css';

export function Quote({ b }: { b: QuoteBlock }) {
  return (
    <div className={g.g}>
      <blockquote className={`${g.wide} ${s.q}`}>
        <p className={s.text}>{b.text}</p>
        {b.p ? <p className={t.p}>{b.p}</p> : null}
      </blockquote>
    </div>
  );
}
