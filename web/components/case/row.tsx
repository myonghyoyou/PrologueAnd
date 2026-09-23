import type { ReactNode } from 'react';
import type { Figure } from '@/content';
import { rowMaxWidth } from '@/lib/figure-rules';
import { Frame } from './frame';
import s from './row.module.css';

const GAP = 12;   // row.module.css .row gap 과 같게

/** 그림 1~3장. 1장이면 틀 하나, 여러 장이면 한 줄 높이 맞춤. overlay 는 첫 그림 틀 안(핫스팟) */
export function Row({ figs, sizes, ctx = 'block', overlay }: {
  figs: Figure[]; sizes: string; ctx?: 'block' | 'phones'; overlay?: ReactNode;
}) {
  const many = figs.length > 1;
  const maxWidth = many ? rowMaxWidth(figs.map((f) => ({ w: f.w!, h: f.h! })), GAP) : undefined;
  return (
    <div className={s.row} data-row-figs style={maxWidth ? { maxWidth } : undefined}>
      {figs.map((f, i) => (
        <Frame key={f.src + i} fig={f} sizes={sizes} ctx={ctx} grow={many}>{i === 0 ? overlay : null}</Frame>
      ))}
    </div>
  );
}
