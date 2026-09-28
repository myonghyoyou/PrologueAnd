import type { Block, Chapter as ChapterData } from '@/content';
import { BlockView } from './block-view';
import { Pinned } from './pinned';
import g from './grid.module.css';
import t from './type.module.css';
import s from './chapter.module.css';

/** 스크롤로 움직이는 그림 한 장만 있는 장은 제목과 함께 헤더 아래에 붙인다(바꾼 흐름 · Before & After) */
const pins = (blocks: Block[]) =>
  blocks.length === 1 && (blocks[0].type === 'wipe' || (blocks[0].type === 'flow' && blocks[0].state === 'morph'));

export function Chapter({ ch, n }: { ch: ChapterData; n: number }) {
  const intro = (
    <div className={`${g.g} ${s.intro}`}>
      <div className={`${g.lab} ${t.lab}`} data-chapter-label>
        {String(n).padStart(2, '0')}<span className={s.name}>{ch.name}</span>
      </div>
      <div className={g.body}>
        <h2 className={t.h2} dangerouslySetInnerHTML={{ __html: ch.h }} />
        {ch.p.map((x, i) => <p key={i} className={t.lead}>{x}</p>)}
      </div>
    </div>
  );

  if (pins(ch.blocks)) {
    const b = ch.blocks[0];
    return (
      <section id={ch.id} className={s.ch} data-chapter data-pinned>
        <Pinned>
          {intro}
          <div className={`${s.block} ${s.fill}`} data-block={b.type}><BlockView b={b} /></div>
        </Pinned>
      </section>
    );
  }

  return (
    <section id={ch.id} className={s.ch} data-chapter>
      {intro}
      {ch.blocks.map((b, i) => (
        <div key={i} className={s.block} data-block={b.type}><BlockView b={b} /></div>
      ))}
    </section>
  );
}
