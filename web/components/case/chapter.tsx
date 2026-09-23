import type { Chapter as ChapterData } from '@/content';
import { BlockView } from './block-view';
import g from './grid.module.css';
import t from './type.module.css';
import s from './chapter.module.css';

export function Chapter({ ch, n }: { ch: ChapterData; n: number }) {
  return (
    <section id={ch.id} className={s.ch} data-chapter>
      <div className={`${g.g} ${s.intro}`}>
        <div className={`${g.lab} ${t.lab}`} data-chapter-label>
          {String(n).padStart(2, '0')}<span className={s.name}>{ch.name}</span>
        </div>
        <div className={g.body}>
          <h2 className={t.h2} dangerouslySetInnerHTML={{ __html: ch.h }} />
          {ch.p.map((x, i) => <p key={i} className={t.lead}>{x}</p>)}
        </div>
      </div>
      {ch.blocks.map((b, i) => (
        <div key={i} className={s.block} data-block={b.type}><BlockView b={b} /></div>
      ))}
    </section>
  );
}
