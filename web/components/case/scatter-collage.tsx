import type { Scatter } from '@/content';
import s from './scatter-collage.module.css';

const POS = [
  { left: '4%', top: '8%', rotate: '-1.2deg' },
  { left: '38%', top: '3%', rotate: '.8deg' },
  { left: '66%', top: '14%', rotate: '-.6deg' },
  { left: '8%', top: '44%', rotate: '.5deg' },
  { left: '44%', top: '40%', rotate: '-1deg' },
  { left: '30%', top: '70%', rotate: '.9deg' },
  { left: '68%', top: '62%', rotate: '-.4deg' },
];

export function ScatterCollage({ items }: { items: Scatter[] }) {
  return (
    <div className={s.box}>
      {items.slice(0, POS.length).map((it, i) => (
        <div key={i} className={s.item} style={{ left: POS[i].left, top: POS[i].top, transform: `rotate(${POS[i].rotate})` }}>
          <p className={s.text}>{it.text}</p>
          <span className={s.from}>{it.from} · {it.at}</span>
        </div>
      ))}
    </div>
  );
}
