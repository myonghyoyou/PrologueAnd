import type { PhonesBlock } from '@/content';
import { Frame } from './frame';
import { NoteText } from './note';
import g from './grid.module.css';
import s from './phones.module.css';

export function Phones({ b }: { b: PhonesBlock }) {
  return (
    <div className={g.g}>
      <div className={g.noteText} data-note-text>
        <NoteText label={b.label} h={b.h} p={b.p} />
      </div>
      <div className={`${g.noteFigs} ${s.band}`} data-phones-band>
        <div className={s.row}>
          {b.figs.map((f, i) => (
            // 높이 = min(640, 원본 높이) → 폭 = 높이 × 비율
            <div key={f.src + i} className={s.one} style={{ width: `calc(min(640px, ${f.h}px) * ${f.w! / f.h!})` }}>
              <Frame fig={f} ctx="phones" sizes="(max-width:1023px) 60vw, 320px" />
            </div>
          ))}
        </div>
        {b.caption ? <p className={s.cap}>{b.caption}</p> : null}
      </div>
    </div>
  );
}
