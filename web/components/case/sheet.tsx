import type { SheetBlock, SheetShow } from '@/content';
import { CropView } from './crop-view';
import g from './grid.module.css';
import s from './sheet.module.css';

function Show({ show, side }: { show: SheetShow; side: 'before' | 'after' }) {
  if ('swatches' in show) return (
    <div className={s.swatches}>{show.swatches.map((w) => <span key={w.hex + w.name}><i style={{ background: w.hex }} aria-hidden="true" />{w.name}</span>)}</div>
  );
  if ('crop' in show) return <CropView c={show.crop} />;
  if ('heights' in show) return (
    <div className={s.bars}>{show.heights.map((h) => <span key={h} className={side === 'after' ? s.barOn : undefined} style={{ height: h }}>{h}px</span>)}</div>
  );
  if ('buttons' in show) return (
    <div className={s.btns}>{show.buttons.map((b) => <span key={b.text} className={`${s.btn} ${s[b.kind] ?? ''}`} data-kind={b.kind}>{b.text}</span>)}</div>
  );
  return <div className={s.frame}>{show.frame.map((f, i) => <span key={f} className={i === 2 ? s.tbl : undefined}>{f}</span>)}</div>;
}

/** 규칙 시트 — 규칙 · 전(1차 화면에서 뽑음) · 후(정한 규칙) 3열. 규칙 열은 장 번호 열 자리라 전·후 칸 폭은 넓게 칸과 같다. 폰은 규칙 · 전 · 후 차례로 쌓인다 */
export function Sheet({ b }: { b: SheetBlock }) {
  return (
    <div className={g.g}>
      <figure className={`${g.full} ${s.fig}`} data-sheet>
        <div className={s.sheet}>
          <div className={s.heads} aria-hidden="true"><span>규칙</span><span>전 · 1차 화면에서 뽑음</span><span>후 · 정한 규칙</span></div>
          {b.rows.map((r, i) => (
            <section key={r.rule} className={s.row} data-sheet-row>
              <h3 className={s.rule}><span className={s.no}>{String(i + 1).padStart(2, '0')}</span>{r.rule}</h3>
              <div className={s.before} data-sheet-cell="before"><p className={s.lab}><em>전</em>{r.before.label}</p><Show show={r.before.show} side="before" /></div>
              <div className={s.after} data-sheet-cell="after"><p className={s.lab}><em>후</em>{r.after.label}</p><Show show={r.after.show} side="after" /></div>
            </section>
          ))}
        </div>
        {b.caption ? <figcaption className={s.cap}>{b.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
