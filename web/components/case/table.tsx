import type { TableBlock, TableCell } from '@/content';
import g from './grid.module.css';
import s from './table.module.css';

function Cell({ c }: { c: TableCell }) {
  if (typeof c === 'string') return <>{c}</>;
  return (
    <>
      <span className={s.sw} data-swatch style={{ background: c.swatch }} aria-hidden="true" />
      {c.text}<span className={s.hex}>{c.swatch}</span>
    </>
  );
}

/** 화면별 차이 표 — 맨 아래 foot 은 비교 줄(굵게, 위 괘선 진하게). 폰은 상자 안에서 가로로 스크롤 */
export function Table({ b }: { b: TableBlock }) {
  const row = (r: TableCell[], k: string) => (
    <tr key={k}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row"><Cell c={c} /></th> : <td key={j}><Cell c={c} /></td>))}</tr>
  );
  return (
    <div className={g.g}>
      <figure className={`${g.body} ${s.fig}`} data-table>
        <div className={s.scroll}>
          <table className={s.t}>
            <thead><tr>{b.cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => row(r, String(i)))}</tbody>
            {b.foot ? <tfoot>{row(b.foot, 'foot')}</tfoot> : null}
          </table>
        </div>
        {b.caption ? <figcaption className={s.cap}>{b.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
