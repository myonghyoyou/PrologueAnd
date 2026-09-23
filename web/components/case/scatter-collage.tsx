import type { Scatter } from '@/content';
import s from './scatter-collage.module.css';

// 4줄(4·4·3·3)로 흩어 두고, 조금씩 겹치고 기울게 한다
const POS = [
  { left: '2%', top: '4%', rotate: '-1.2deg' },
  { left: '26%', top: '2%', rotate: '.8deg' },
  { left: '50%', top: '6%', rotate: '-.6deg' },
  { left: '72%', top: '3%', rotate: '1.4deg' },
  { left: '6%', top: '27%', rotate: '.5deg' },
  { left: '31%', top: '24%', rotate: '-1deg' },
  { left: '55%', top: '29%', rotate: '.9deg' },
  { left: '74%', top: '26%', rotate: '-1.5deg' },
  { left: '1%', top: '51%', rotate: '1deg' },
  { left: '33%', top: '53%', rotate: '-.4deg' },
  { left: '62%', top: '50%', rotate: '.6deg' },
  { left: '8%', top: '76%', rotate: '-.8deg' },
  { left: '38%', top: '78%', rotate: '1.2deg' },
  { left: '66%', top: '75%', rotate: '-1.1deg' },
];

export function ScatterCollage({ items }: { items: Scatter[] }) {
  return (
    <div className={s.box}>
      {items.slice(0, POS.length).map((it, i) => (
        <div key={i} data-scatter-item className={s.item} style={{ left: POS[i].left, top: POS[i].top, transform: `rotate(${POS[i].rotate})` }}>
          <p className={s.text}>{it.text}</p>
          <span className={s.from}>{it.from} · {it.at}</span>
        </div>
      ))}
    </div>
  );
}
